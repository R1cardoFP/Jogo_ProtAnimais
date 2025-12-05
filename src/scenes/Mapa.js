import Player from '../scenes/Player.js';

export default class Mapa extends Phaser.Scene {

    constructor() {
        super('Mapa');
    }

    preload() {
        const tilesPath = encodeURI('assets/map/pixel_16_woods v2 free/free_pixel_16_woods.png');
   
        this.load.image('tiles', tilesPath);

        this.load.tilemapTiledJSON('map', 'assets/map/map.json');
        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });

        
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tsName = map.tilesets && map.tilesets[0] ? map.tilesets[0].name : 'tiles';
        const keyToUse = this.textures.exists(tsName) ? tsName : 'tiles';
        const tiles = map.addTilesetImage(tsName, keyToUse, map.tileWidth, map.tileHeight, 0, 0);

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

        // spawn centro do mapa ou objecto Spawn Point
        let spawn = { x: map.widthInPixels / 2, y: map.heightInPixels / 2 };
        if (map.findObject) {
            const obj = map.findObject('Objects', o => o.name === 'Spawn Point');
            if (obj && obj.x !== undefined && obj.y !== undefined) {
                spawn = { x: obj.x, y: obj.y };
            }
        }

        // criar jogador com classe dedicada
        this.player = new Player(this, spawn.x, spawn.y);

        // colisão jogador 
        if (obstaculos) this.physics.add.collider(this.player, obstaculos);

        // limites do mundo e câmara
        const mapW = map.widthInPixels || this.scale.width;
        const mapH = map.heightInPixels || this.scale.height;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBounds(0, 0, mapW, mapH);

        const FIXED_ZOOM = 3;
        this.cameras.main.setZoom(FIXED_ZOOM);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        this.cameras.main.roundPixels = true;

        const dzWidth = Math.round(this.scale.width / 6);
        const dzHeight = Math.round(this.scale.height / 6);
        this.cameras.main.setDeadzone(dzWidth, dzHeight);
        this.cameras.main.centerOn(spawn.x, spawn.y);
        this.cameras.main.setBackgroundColor('#0b0b20');

        // controlos e animações do jogador
        this.cursors = this.input.keyboard.createCursorKeys();
        this.anims.create({ key: 'esquerdadireita', frames: this.anims.generateFrameNumbers('player', { frames:[1,7,1,13] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('player', { frames:[2,8,2,14] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('player', { frames:[0,6,0,12] }), frameRate: 10, repeat: -1 });
    }

    update() {
        if (!this.player) return;
        if (this.player.update) this.player.update(this.cursors);

        
    }

}