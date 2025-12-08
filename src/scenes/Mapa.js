import Player from '../scenes/Player.js';
import Animal from '../scenes/Animal.js';
import Armadilha from '../scenes/Armadilha.js';

export default class Mapa extends Phaser.Scene {

    constructor() {
        super('Mapa');
    }

    preload() {
        const tilesPath = encodeURI('assets/map/pixel_16_woods v2 free/free_pixel_16_woods.png');
      
        this.load.image('tiles', tilesPath);

        this.load.tilemapTiledJSON('map', 'assets/map/map.json');
        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('dogs', 'assets/dogs.png', { frameWidth: 16, frameHeight: 16 });
       
        this.load.spritesheet('trap', 'assets/Bear_Trap.png', { frameWidth: 16, frameHeight: 16 });

        // adicionar carregamento do som da armadilha
        this.load.audio('trap_snap', 'assets/sound/BearTrap.mp3');

        // novo: carregar som do latido do cão 
        this.load.audio('dog_bark', 'assets/sound/DogBark.mp3');
        
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tsName = map.tilesets && map.tilesets[0] ? map.tilesets[0].name : 'tiles';
        // verificar se o tileset está carregado, senão usar 'tiles' 
        const keyToUse = this.textures.exists(tsName) ? tsName : 'tiles';
        const tiles = map.addTilesetImage(tsName, keyToUse, map.tileWidth, map.tileHeight, 0, 0);

        // criar layers apenas se existirem no mapa
        const relva = map.getLayer('Relva') ? map.createLayer('Relva', tiles, 0, 0) : null;
        const decoracao = map.getLayer('Decoracao') ? map.createLayer('Decoracao', tiles, 0, 0) : null;
        const obstaculos = map.getLayer('Obstaculos') ? map.createLayer('Obstaculos', tiles, 0, 0) : null;

        if (relva) relva.setDepth(0);
        if (decoracao) decoracao.setDepth(20);
        if (obstaculos) {
            obstaculos.setDepth(100);
            obstaculos.setCollisionByProperty({ collides: true });
            obstaculos.setCollisionByExclusion([-1]);
        }

        // spawn  centro do mapa
        let spawn = { x: map.widthInPixels / 2, y: map.heightInPixels / 2 };
        if (map.findObject) {
            const obj = map.findObject('Objects', o => o.name === 'Spawn Point');
            if (obj && obj.x !== undefined && obj.y !== undefined) {
                spawn = { x: obj.x, y: obj.y };
            }
        }

        // guardar spawn para respawn futuro
        this.spawn = spawn;
        // contador de mortes
        this.deathCount = 0;

        // criar jogador
        this.player = new Player(this, spawn.x, spawn.y);

        // inicializar contadores mínimos
        this.rescuedCount = 0;
        this.DOG_TARGET = 6;

        // HUD overlay 
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

            // calcula e aplica posição baseada no canvas
            const updateOverlayPosition = () => {
                const canvas = body.querySelector('#game-container canvas') || body.querySelector('canvas');
                if (!canvas) return;
                const r = canvas.getBoundingClientRect();
                // posição 8px dentro do canvas
                el.style.left = (window.scrollX + r.left + 8) + 'px';
                el.style.top = (window.scrollY + r.top + 8) + 'px';
            };

            // chamar imediatamente e registar resize/scroll
            updateOverlayPosition();
            scene._hudUpdatePos = updateOverlayPosition;
            window.addEventListener('resize', updateOverlayPosition);
            window.addEventListener('scroll', updateOverlayPosition);

            // remover ao fechar a scene
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
            const resgat = (typeof this.rescuedCount !== 'undefined') ? this.rescuedCount : 0;
            if (this._hudOverlayEl) {
                this._hudOverlayEl.textContent = `Vidas: ${vidas}   Resgatados: ${resgat}/${this.DOG_TARGET}`;
            }
        };

        // atualizar inicialmente
        this.updateTopText();
        // assegurar posição correcta 
        if (typeof this._hudUpdatePos === 'function') this._hudUpdatePos();

        // adicionar colisão entre jogador e layer de obstáculos
        if (obstaculos) {
            this.physics.add.collider(this.player, obstaculos);
        }

        // limites do mundo e câmara
        const mapW = map.widthInPixels || this.scale.width;
        const mapH = map.heightInPixels || this.scale.height;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBounds(0, 0, mapW, mapH);

        // zoom fixo 
        const FIXED_ZOOM = 3;
        this.cameras.main.setZoom(FIXED_ZOOM);

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        // arredondar pixels para evitar artefactos com pixel-art
        this.cameras.main.roundPixels = true;

        // mantém jogador dentro de uma área antes da câmara começar a mover
        const dzWidth = Math.round(this.scale.width / 6);
        const dzHeight = Math.round(this.scale.height / 6);
        this.cameras.main.setDeadzone(dzWidth, dzHeight);

        // centra inicialmente no spawn 
        this.cameras.main.centerOn(spawn.x, spawn.y);

        // fundo
        this.cameras.main.setBackgroundColor('#0b0b20');

        // controlos e animações
        this.cursors = this.input.keyboard.createCursorKeys();
        this.anims.create({ key: 'esquerdadireita', frames: this.anims.generateFrameNumbers('player', { frames:[1,7,1,13] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('player', { frames:[2,8,2,14] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('player', { frames:[0,6,0,12] }), frameRate: 10, repeat: -1 });

        // animação da armadilha 
        if (!this.anims.exists('trap_anim')) {
            this.anims.create({
                key: 'trap_anim',
                frames: this.anims.generateFrameNumbers('trap', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
        }

      
       
        this.dogsGroup = this.physics.add.group();
        const minDistFromPlayer = 64;
        const minDistBetweenDogs = 96;
        const MAX_TRIES = 120;

        // função para encontrar posição válida 
        const findValidPos = (avoidList = [], minDist = minDistFromPlayer) => {
            for (let i = 0; i < MAX_TRIES; i++) {
                const tx = Phaser.Math.Between(0, map.width - 1);
                const ty = Phaser.Math.Between(0, map.height - 1);
                if (obstaculos) {
                    const tile = obstaculos.getTileAt(tx, ty);
                    if (tile && tile.index !== -1) continue;
                }
                const wx = map.tileToWorldX(tx) + map.tileWidth / 2;
                const wy = map.tileToWorldY(ty) + map.tileHeight;
                if (Phaser.Math.Distance.Between(wx, wy, spawn.x, spawn.y) < minDist) continue;
                let tooClose = false;
                for (const p of avoidList) {
                    if (Phaser.Math.Distance.Between(wx, wy, p.x, p.y) < minDistBetweenDogs) {
                        tooClose = true; break;
                    }
                }
                if (tooClose) continue;
                return { x: wx, y: wy };
            }
            return null;
        };

        // criar cães 

        const dogsTex = this.textures.get('dogs');
        const totalFrames = dogsTex ? Math.max(1, Math.floor(dogsTex.getSourceImage().width / 16) * Math.floor(dogsTex.getSourceImage().height / 16)) : 1;
        const spawnedPositions = [];

        // criar o número alvo de cães
        for (let i = 0; i < this.DOG_TARGET; i++) {
            const pos = findValidPos(spawnedPositions);
            if (!pos) break; // não conseguiu encontrar mais posições válidas
            const frameIndex = Phaser.Math.Between(0, totalFrames - 1);
            const dog = new Animal(this, pos.x, pos.y, frameIndex);
            this.dogsGroup.add(dog);
            spawnedPositions.push(pos);
            // adicionar overlap entre jogador e cão
            this.physics.add.overlap(this.player, dog, () => {
                if (!dog._rescued) {
                    // tocar som 
                    if (this.sound) this.sound.play('dog_bark');
                    this.rescueDog(dog);
                    dog.rescue();
                }
            }, null, this);
        }

        // criar armadilhas 
        this.trapsGroup = this.physics.add.group();
        const trapsLayer = map.getObjectLayer ? map.getObjectLayer('Traps') : null;
        const TRAP_TARGET = 12;

        
        if (trapsLayer && trapsLayer.objects && trapsLayer.objects.length) {
          
            for (const obj of trapsLayer.objects) {
                const tx = (obj.x || 0) + ((obj.width) ? obj.width / 2 : map.tileWidth / 2);
                const ty = (obj.y || 0) + ((obj.height) ? obj.height : map.tileHeight);
                const trap = new Armadilha(this, tx, ty, 0, 'trap');
                this.trapsGroup.add(trap);
                this.physics.add.overlap(this.player, trap, () => {
                    if (!trap.activated) {
                        // tocar som 
                        if (this.sound) this.sound.play('trap_snap');
                        trap.trigger();
                    }
                }, null, this);
            }
        } else {
        
            for (let i = 0; i < TRAP_TARGET; i++) {
                const pos = findValidPos([], 48);
                if (!pos) break;
                const trap = new Armadilha(this, pos.x, pos.y, 0, 'trap');
                this.trapsGroup.add(trap);
                this.physics.add.overlap(this.player, trap, () => {
                    if (!trap.activated) {
                        // tocar som 
                        if (this.sound) this.sound.play('trap_snap');
                        trap.trigger();
                    }
                }, null, this);
            }
        }
    }

    // função de resgate 
    rescueDog(dog) {
      
        if (!dog || dog._rescued === true) return;

        // actualiza contador/HUD
        this.rescuedCount = (this.rescuedCount || 0) + 1;
        if (typeof this.updateTopText === 'function') this.updateTopText();

        // se atingiu o objetivo, transição  para a Caverna
        const target = this.DOG_TARGET || 6;
        if (this.rescuedCount >= target) {
            if (this._goingToCaverna) return; // proteger contra chamadas duplicadas
            this._goingToCaverna = true;

            // remover HUD overlay 
            if (this._hudUpdatePos && typeof this._hudUpdatePos === 'function') {
                window.removeEventListener('resize', this._hudUpdatePos);
                window.removeEventListener('scroll', this._hudUpdatePos);
                this._hudUpdatePos = null;
            }
            if (this._hudOverlayEl && this._hudOverlayEl.parentNode) {
                this._hudOverlayEl.parentNode.removeChild(this._hudOverlayEl);
                this._hudOverlayEl = null;
            }

            // desativar input/jogador/câmara 
            if (this.input && typeof this.input.enabled !== 'undefined') this.input.enabled = false;
            if (this.player && this.player.body) this.player.body.enable = false;
            if (this.cameras && this.cameras.main) this.cameras.main.stopFollow();

            // pequeno delay antes de mudar de cena e passar quantos cães já foram resgatados
            this.time.delayedCall(350, () => this.scene.start('Caverna', {
                 rescued: this.rescuedCount
             }));
        }
    }

    // chamada quando o jogador morre 
	handlePlayerDeath() {
		// se já estamos em GameOver, não fazer nada
		if (this.isGameOver) return;

		// incrementar contador de mortes
		this.deathCount = (this.deathCount || 0) + 1;
		

		// se atingir 3 mortes: marcar gameOver e ir diretamente para a cena GameOver
		if (this.deathCount >= 3) {
			// impedir qualquer respawn futuro
			this.isGameOver = true;

			// cancelar timer de respawn pendente se existir
			if (this._respawnTimer && typeof this._respawnTimer.remove === 'function') {
				this._respawnTimer.remove(false);
				this._respawnTimer = null;
			}

			// desativar jogador e parar a câmara de o seguir
			if (this.player) {
				if (this.player.body) this.player.body.enable = false;
				this.player.setActive(false);
				this.player.setVisible(false);
			}
			if (this.cameras && this.cameras.main) this.cameras.main.stopFollow();

			// mudar imediatamente para GameOver
			this.scene.start('GameOver', { deaths: this.deathCount });
			return;
		}

		

		
	}

    update() {
        if (!this.player) return;
        // chamar update do player
        if (this.player.update) this.player.update(this.cursors);
    }

   
}