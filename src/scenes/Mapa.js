import Player from '../scenes/Player.js';
import Animal from '../scenes/Animal.js';

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
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tsName = map.tilesets && map.tilesets[0] ? map.tilesets[0].name : 'tiles';
        // se o tileset no JSON tiver um nome diferente, usa 'tiles' como fallback
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

        // criar jogador
        this.player = new Player(this, spawn.x, spawn.y);

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

        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        // arredondar pixels para evitar artefactos com pixel-art
        this.cameras.main.roundPixels = true;

        // deadzone opcional — mantém jogador dentro de uma área antes da câmara começar a mover
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

        // completamente aleatório de cães
        this.DOG_TARGET = 6;                     
        this.dogsGroup = this.physics.add.group();
        const HITBOX_W = 10;
        const HITBOX_H = 12;
        const MAX_ATTEMPTS = 300;
        const minDistFromPlayer = 64; 
        const minDistBetweenDogs = 96;

        const dogsTex = this.textures.get('dogs');
        if (!dogsTex) {
            
        } else {
            const src = dogsTex.getSourceImage();
            const cols = Math.max(1, Math.floor(src.width / 16));
            const rows = Math.max(1, Math.floor(src.height / 16));
            const totalFrames = cols * rows;

            const spawnedPositions = [];
            let spawned = 0;
            let globalAttempts = 0;
            const maxGlobalAttempts = this.DOG_TARGET * MAX_ATTEMPTS;

            while (spawned < this.DOG_TARGET && globalAttempts < maxGlobalAttempts) {
                globalAttempts++;
                let attempt = 0;
                let valid = false;
                let worldX = 0;
                let worldY = 0;
                let tileX = 0;
                let tileY = 0;

                while (!valid && attempt < MAX_ATTEMPTS) {
                    attempt++;
                    tileX = Phaser.Math.Between(0, map.width - 1);
                    tileY = Phaser.Math.Between(0, map.height - 1);

                    worldX = map.tileToWorldX(tileX) + map.tileWidth / 2;
                    worldY = map.tileToWorldY(tileY) + map.tileHeight;

                    // não spawnar muito perto do spawn
                    if (Phaser.Math.Distance.Between(worldX, worldY, spawn.x, spawn.y) < minDistFromPlayer) continue;

                    // evita tiles de obstáculos
                    let blocked = false;
                    if (obstaculos) {
                        const t = obstaculos.getTileAt(tileX, tileY);
                        if (t && t.index !== -1) blocked = true;
                    }
                    if (blocked) continue;

                    // evita posição perto de já spawnados
                    let tooClose = false;
                    for (let p of spawnedPositions) {
                        if (Phaser.Math.Distance.Between(worldX, worldY, p.x, p.y) < minDistBetweenDogs) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (tooClose) continue;

                    valid = true;
                }

                if (!valid) {
                    
                    continue;
                }

                // spawn do cão usando a classe Animal
                const frameIndex = Phaser.Math.Between(0, Math.max(0, totalFrames - 1));
                const dog = new Animal(this, worldX, worldY, frameIndex);
                this.dogsGroup.add(dog);
                spawnedPositions.push({ x: worldX, y: worldY });
                spawned++;

                // overlap -> resgate
                this.physics.add.overlap(this.player, dog, () => {
                    if (!dog._rescued) {
                        dog.rescue();
                        this.rescueDog(dog);
                    }
                }, null, this);
            }

            if (spawned < this.DOG_TARGET) {
                console.warn(`Spawnou apenas ${spawned}/${this.DOG_TARGET} cães (limite de tentativas atingido).`);
            }
        }


    }

    // função de resgate simples
    rescueDog(dog) {
        if (!dog || dog._rescued === false) {
            // nothing to do
        }
        // actualiza contador/HUD se tiveres
        this.rescuedCount = (this.rescuedCount || 0) + 1;
        if (this.rescuedText) this.rescuedText.setText('Resgatados: ' + this.rescuedCount + '/' + (this.DOG_TARGET || 6));
        if (this.rescuedCount >= (this.DOG_TARGET || 6)) {
            this.time.delayedCall(350, () => this.scene.start('Nivel2'));
        }
    }

    update() {
        if (!this.player) return;
        // chamar update do player (mantém controlo centralizado)
        if (this.player.update) this.player.update(this.cursors);
    }

   
}