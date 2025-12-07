import Player from './Player.js';

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

		//câmara centrada no mapa
		const mapW = map.widthInPixels || this.scale.width;
		const mapH = map.heightInPixels || this.scale.height;
		this.physics.world.setBounds(0, 0, mapW, mapH);
		this.cameras.main.setBounds(0, 0, mapW, mapH);
		this.cameras.main.centerOn(Math.round(mapW / 2), Math.round(mapH / 2));
	}
}
