import Player from './Player.js';
import Animal from './Animal.js';
import Armadilha from './Armadilha.js';

export default class Caverna extends Phaser.Scene {
	constructor() {
		super('Caverna');
	}

	preload() {
		// carregar apenas o tilemap 
		this.load.tilemapTiledJSON('map_caverna', 'assets/map/caverna.json');

		// carregar imagens dos tilesets 
		const base = 'assets/map/pixel_16_woods v2 free/';
		this.load.image('Assets_Shroom_Cave', encodeURI(base + 'Assets_Shroom_Cave.png'));
		this.load.image('free_pixel_16_woods', encodeURI(base + 'free_pixel_16_woods.png'));
		this.load.image('MainLev2.0', encodeURI(base + 'MainLev2.0.png'));
		// carregar sprites do jogador 
		this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });
		// carregar spritesheet dos cães
		this.load.spritesheet('dogs', 'assets/dogs.png', { frameWidth: 16, frameHeight: 16 });
		// carregar spritesheet da armadilha
		this.load.spritesheet('trap', 'assets/Bear_Trap.png', { frameWidth: 16, frameHeight: 16 });

		// carregar sons de efeitos
		this.load.audio('trap_snap', 'assets/sound/BearTrap.mp3');
		this.load.audio('dog_bark', 'assets/sound/DogBark.mp3');
	}

	create(data) {
		const map = this.make.tilemap({ key: 'map_caverna' });

		// inicializar contador de resgatados 
		this.rescuedCount = (data && typeof data.rescued !== 'undefined') ? data.rescued : 0;
		//guardar quantos ja tinha
		this.initialRescued = this.rescuedCount;
		// contador  dos resgates na caverna
		this.rescuedInCave = 0;
		// meta de cães na caverna 
		this.CAVE_DOG_TARGET = 10;

		// adicionar HUD igual ao implementado em Mapa
		(function createHUDOverlay(scene) {
			const body = document.body;
			let el = document.getElementById('hud-overlay');
			if (!el) {
				el = document.createElement('div');
				el.id = 'hud-overlay';
				Object.assign(el.style, {
					position: 'absolute',
					padding: '6px 10px',
					fontFamily: 'monospace',
					fontSize: '18px',
					color: '#ffffff',
					background: 'rgba(0,0,0,0.35)',
					zIndex: 9999,
					pointerEvents: 'none',
					whiteSpace: 'nowrap'
				});
				body.appendChild(el);
			}
			scene._hudOverlayEl = el;

			// posiciona o overlay em relação ao canvas
			const updateOverlayPosition = () => {
				const canvas = body.querySelector('#game-container canvas') || body.querySelector('canvas');
				if (!canvas) return;
				const r = canvas.getBoundingClientRect();
				el.style.left = (window.scrollX + r.left + 8) + 'px';
				el.style.top = (window.scrollY + r.top + 8) + 'px';
			};

			
			updateOverlayPosition();
			scene._hudUpdatePos = updateOverlayPosition;
			window.addEventListener('resize', updateOverlayPosition);
			window.addEventListener('scroll', updateOverlayPosition);

			// limpar ao fechar a scene
			scene.events.on('shutdown', () => {
				window.removeEventListener('resize', updateOverlayPosition);
				window.removeEventListener('scroll', updateOverlayPosition);
				if (scene._hudOverlayEl && scene._hudOverlayEl.parentNode) {
					scene._hudOverlayEl.parentNode.removeChild(scene._hudOverlayEl);
					scene._hudOverlayEl = null;
				}
			});
		})(this);

		// função para atualizar o texto superior
		this.updateTopText = () => {
			const vidas = (this.player && typeof this.player.health !== 'undefined') ? this.player.health : 0;
			const res = (typeof this.rescuedInCave !== 'undefined') ? this.rescuedInCave : 0;
			if (this._hudOverlayEl) this._hudOverlayEl.textContent = `Vidas: ${vidas}   Resgatados: ${res}/${this.CAVE_DOG_TARGET}`;
		};
		

		// adicionar todos os tilesets 
		const tilesetObjs = map.tilesets.map(ts => {
			return map.addTilesetImage(ts.name, ts.name, ts.tilewidth, ts.tileheight, ts.margin || 0, ts.spacing || 0);
		});

		// criar layers 
		const floor = map.getLayer('Chao') ? map.createLayer('Chao', tilesetObjs, 0, 0) : null;
		const decor = map.getLayer('Decoracao') ? map.createLayer('Decoracao', tilesetObjs, 0, 0) : null;
		const obst = map.getLayer('Obstaculos') ? map.createLayer('Obstaculos', tilesetObjs, 0, 0) : null;

		if (obst) {
		this.rescuedCount = (data && typeof data.rescued !== 'undefined') ? data.rescued : 0;
		// guardar quantos caes ja tinha
		this.initialRescued = this.rescuedCount;
			obst.setCollisionByExclusion([-1]);
		}

		// encontrar spawn no object layer 'Objects' com name 'Spawn Point' (fallback centro)
		let spawn = { x: Math.round((map.widthInPixels || this.scale.width) / 2), y: Math.round((map.heightInPixels || this.scale.height) / 2) };
		if (map.findObject) {
			const obj = map.findObject('Objects', o => o.name === 'Spawn Point');
			if (obj && typeof obj.x !== 'undefined' && typeof obj.y !== 'undefined') spawn = { x: obj.x, y: obj.y };
		}

		// criar jogador no spawn
		this.player = new Player(this, spawn.x, spawn.y);

		// criar animações básicas 
		if (!this.anims.exists('esquerdadireita')) {
			this.anims.create({ key: 'esquerdadireita', frames: this.anims.generateFrameNumbers('player', { frames: [1,7,1,13] }), frameRate: 10, repeat: -1 });
			this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('player', { frames: [2,8,2,14] }), frameRate: 10, repeat: -1 });
			this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('player', { frames: [0,6,0,12] }), frameRate: 10, repeat: -1 });
		}

		// configurar zoom e seguir jogador
		const FIXED_ZOOM = 3;
		this.cameras.main.setZoom(FIXED_ZOOM);
		this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
		this.cameras.main.roundPixels = true;

		// adicionar colisão jogador <-> obstáculos
		if (obst) {
			this.physics.add.collider(this.player, obst);
		}

		// adicionar 10 animais com spawns aleatórios
		this.dogsGroup = this.physics.add.group();
		const DOG_COUNT = 10;
		const MAX_TRIES = 200;
		const mapWW = map.width || map.widthInPixels / map.tileWidth;
		const mapHH = map.height || map.heightInPixels / map.tileHeight;

		const isBlockedTile = (tx, ty) => {
			if (!obst) return false;
			const tile = obst.getTileAt(tx, ty);
			return !!(tile && tile.index !== -1);
		};

		const findPos = (tries = MAX_TRIES, minDist = 48) => {
			for (let i = 0; i < tries; i++) {
				const tx = Phaser.Math.Between(0, (mapWW || 1) - 1);
				const ty = Phaser.Math.Between(0, (mapHH || 1) - 1);
				if (isBlockedTile(tx, ty)) continue;
				const wx = map.tileToWorldX(tx) + map.tileWidth / 2;
				const wy = map.tileToWorldY(ty) + map.tileHeight;
				if (Phaser.Math.Distance.Between(wx, wy, spawn.x, spawn.y) < minDist) continue;
				// evitar spawn sobre outros cães
				let collideOther = false;
				this.dogsGroup.getChildren().forEach(d => {
					if (Phaser.Math.Distance.Between(d.x, d.y, wx, wy) < minDist) collideOther = true;
				});
				if (collideOther) continue;
				return { x: wx, y: wy };
			}
			return null;
		};

		for (let i = 0; i < DOG_COUNT; i++) {
			const p = findPos();
			if (!p) break;
			const frame = Phaser.Math.Between(0, Math.max(0, Math.floor((this.textures.get('dogs').getSourceImage().width / 16)) - 1));
			const dog = new Animal(this, p.x, p.y, frame);
			this.dogsGroup.add(dog);
			this.physics.add.overlap(this.player, dog, () => {
				if (!dog._rescued) {
					// tocar som de latido 
					if (this.sound) this.sound.play('dog_bark');
					dog.rescue();
					// atualizar contadores
					this.rescuedInCave = (this.rescuedInCave || 0) + 1;
					this.rescuedCount = (this.rescuedCount || 0) + 1;
					if (typeof this.updateTopText === 'function') this.updateTopText();

					// se resgatou todos os cães da caverna, ir para o fim de jogo e enviar dados de quantos resgates teve
					if (!this._goingToFim && this.rescuedInCave >= this.CAVE_DOG_TARGET) {
						this._goingToFim = true;
						this.scene.start('FimJogo', {
							rescuedFromMap: this.initialRescued,
							rescuedInCave: this.rescuedInCave,
							totalRescued: this.rescuedCount
						});
					}
				}
			}, null, this);
		}

		// adicionar armadilhas cerca de 20
		if (!this.anims.exists('trap_anim')) {
			this.anims.create({
				key: 'trap_anim',
				frames: this.anims.generateFrameNumbers('trap', { start: 0, end: 2 }),
				frameRate: 8,
				repeat: 0
			});
		}
		
		this.trapsGroup = this.physics.add.group();
		const TRAP_COUNT = 20;
		const trapsLayer = map.getObjectLayer ? map.getObjectLayer('Traps') : null;

		if (trapsLayer && trapsLayer.objects && trapsLayer.objects.length) {
			for (const obj of trapsLayer.objects) {
				const tx = (obj.x || 0) + ((obj.width) ? obj.width / 2 : map.tileWidth / 2);
				const ty = (obj.y || 0) + ((obj.height) ? obj.height : map.tileHeight);
				const trap = new Armadilha(this, tx, ty, 0, 'trap');
				this.trapsGroup.add(trap);
				this.physics.add.overlap(this.player, trap, () => {
					if (!trap.activated) {
						if (this.sound) this.sound.play('trap_snap');
						trap.trigger();
					}
				}, null, this);
			}
		} else {
			// gerar posições aleatórias
			for (let i = 0; i < TRAP_COUNT; i++) {
				let p = null;
				for (let t = 0; t < 200 && !p; t++) {
					const tx = Phaser.Math.Between(0, (map.width || 1) - 1);
					const ty = Phaser.Math.Between(0, (map.height || 1) - 1);
					if (obst && obst.getTileAt(tx, ty) && obst.getTileAt(tx, ty).index !== -1) continue;
					const wx = map.tileToWorldX(tx) + map.tileWidth / 2;
					const wy = map.tileToWorldY(ty) + map.tileHeight;
					if (Phaser.Math.Distance.Between(wx, wy, spawn.x, spawn.y) < 32) continue;
					const tooClose = this.trapsGroup.getChildren().some(d => Phaser.Math.Distance.Between(d.x, d.y, wx, wy) < 48);
					if (tooClose) continue;
					p = { x: wx, y: wy };
				}
				if (!p) continue;
				const trap = new Armadilha(this, p.x, p.y, 0, 'trap');
				this.trapsGroup.add(trap);
				this.physics.add.overlap(this.player, trap, () => {
					if (!trap.activated) {
						if (this.sound) this.sound.play('trap_snap');
						trap.trigger();
					}
				}, null, this);
			}
		}

		// criar controlos 
		this.cursors = this.input.keyboard.createCursorKeys();

		//câmara centrada no mapa
		const mapW = map.widthInPixels || this.scale.width;
		const mapH = map.heightInPixels || this.scale.height;
		this.physics.world.setBounds(0, 0, mapW, mapH);
		this.cameras.main.setBounds(0, 0, mapW, mapH);
		this.cameras.main.centerOn(Math.round(mapW / 2), Math.round(mapH / 2));

                    

		// atualizar HUD
		if (typeof this.updateTopText === 'function') this.updateTopText();
	}

	update() {
		if (this.player && this.player.update) {
			this.player.update(this.cursors);
		}
	}
}
