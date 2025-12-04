export default class Mapa extends Phaser.Scene {

    constructor() {
        super('Mapa');
    }

    preload() {
        const tilesPath = encodeURI('assets/map/pixel_16_woods v2 free/free_pixel_16_woods.png');
        // carrega a imagem com a key igual ao name em map.json
        this.load.image('free_pixel_16_woods', tilesPath);
        // alias genérico
        this.load.image('tiles', tilesPath);

        // força bypass do cache adicionando timestamp
        this.load.tilemapTiledJSON('map', 'assets/map/map.json');

        this.load.spritesheet('player', 'assets/RPG_assets.png', { frameWidth: 16, frameHeight: 16 });

        

    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tsName = map.tilesets && map.tilesets[0] ? map.tilesets[0].name : 'free_pixel_16_woods';
        const keyToUse = this.textures.exists(tsName) ? tsName : 'free_pixel_16_woods';
        if (!this.textures.exists(keyToUse)) {
            console.error('Tileset texture não encontrada. Verifica preload.');
            return;
        }
        const tiles = map.addTilesetImage(tsName, keyToUse);

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

        // criar jogador
        this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player', 6);
        this.player.setCollideWorldBounds(true);

        // ajustar hitbox 
        if (this.player.body && this.player.body.setSize) {
            this.player.body.setSize(10, 12);
            this.player.body.setOffset(3, 4);
        }

        // desenhar jogador abaixo das layers de obstáculos
        this.player.setDepth(50);

        // adicionar colisão entre jogador e layer de obstáculos
        if (obstaculos) {
            this.physics.add.collider(this.player, obstaculos);
        }

        // limites do mundo e câmara
        const mapW = map.widthInPixels || this.scale.width;
        const mapH = map.heightInPixels || this.scale.height;
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBounds(0, 0, mapW, mapH);

        // zoom fixo (muda o número para ajustar)
        const FIXED_ZOOM = 3;
        this.cameras.main.setZoom(FIXED_ZOOM);

        // follow suave (a câmara move-se conforme o jogador)
        // último argumento true faz a câmara seguir a sprite usando o centreOnFollow
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        // arredondar pixels para evitar artefactos com pixel-art
        this.cameras.main.roundPixels = true;

        // deadzone opcional — mantém jogador dentro de uma área antes da câmara começar a mover
        const dzWidth = Math.round(this.scale.width / 6);
        const dzHeight = Math.round(this.scale.height / 6);
        this.cameras.main.setDeadzone(dzWidth, dzHeight);

        // centra inicialmente no spawn (útil no início)
        this.cameras.main.centerOn(spawn.x, spawn.y);

        // fundo
        this.cameras.main.setBackgroundColor('#0b0b20');

        // controlos e animações
        this.cursors = this.input.keyboard.createCursorKeys();
        this.anims.create({ key: 'esquerdadireita', frames: this.anims.generateFrameNumbers('player', { frames:[1,7,1,13] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'up', frames: this.anims.generateFrameNumbers('player', { frames:[2,8,2,14] }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'down', frames: this.anims.generateFrameNumbers('player', { frames:[0,6,0,12] }), frameRate: 10, repeat: -1 });



    }

    update() {
        if (!this.player || !this.player.body) return;

        // resetar velocidades
        this.player.body.setVelocity(0);
        const speed = 80;

        // movimento
        if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed);
        else if (this.cursors.right.isDown) this.player.body.setVelocityX(speed);
        if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed);
        else if (this.cursors.down.isDown) this.player.body.setVelocityY(speed);

        // animações 
        if (this.cursors.up.isDown) {
            this.player.anims.play('up', true);
            this.player.flipX = false;
        } else if (this.cursors.down.isDown) {
            this.player.anims.play('down', true);
            this.player.flipX = false;
        } else if (this.cursors.left.isDown) {
            this.player.anims.play('esquerdadireita', true);
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.anims.play('esquerdadireita', true);
            this.player.flipX = false;
        } else {
            this.player.anims.stop();
            this.player.setFrame(0);
        }
    }
}