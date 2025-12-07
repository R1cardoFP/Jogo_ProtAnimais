import Player from './Player.js';
import Animal from './Animal.js';

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
	}

	create() {
		const map = this.make.tilemap({ key: 'map_caverna' });

		// adicionar todos os tilesets 
		const tilesetObjs = map.tilesets.map(ts => {
			return map.addTilesetImage(ts.name, ts.name, ts.tilewidth, ts.tileheight, ts.margin || 0, ts.spacing || 0);
		});

		// criar layers 
		const floor = map.getLayer('Chao') ? map.createLayer('Chao', tilesetObjs, 0, 0) : null;
		const decor = map.getLayer('Decoracao') ? map.createLayer('Decoracao', tilesetObjs, 0, 0) : null;
		const obst = map.getLayer('Obstaculos') ? map.createLayer('Obstaculos', tilesetObjs, 0, 0) : null;

		if (obst) {
			obst.setCollisionByProperty({ collides: true });
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
				if (!dog._rescued) dog.rescue();
			}, null, this);
		}

		// criar controlos 
		this.cursors = this.input.keyboard.createCursorKeys();

		//câmara centrada no mapa
		const mapW = map.widthInPixels || this.scale.width;
		const mapH = map.heightInPixels || this.scale.height;
		this.physics.world.setBounds(0, 0, mapW, mapH);
		this.cameras.main.setBounds(0, 0, mapW, mapH);
		this.cameras.main.centerOn(Math.round(mapW / 2), Math.round(mapH / 2));
	}

	update() {
		if (this.player && this.player.update) {
			this.player.update(this.cursors);
		}
	}
}
