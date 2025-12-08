export class Start extends Phaser.Scene {
    constructor() {
        // construtor da cena Start
        super({ key: 'Start' });
    }

    create() {
    

        // obter largura e altura do ecrã/área de jogo
        const w = this.scale.width;
        const h = this.scale.height;

        // fundo simples (rect que preenche todo o ecrã)
        this.add.rectangle(0, 0, w, h, 0x0b2a3a).setOrigin(0);

        // título do jogo, tamanho relativo à altura
        const titleSize = Math.round(h * 0.09);
        this.add.text(w / 2, h * 0.12, 'Proteção de Animais', {
            fontFamily: 'Arial',
            fontSize: `${titleSize}px`,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // texto com autor e número
        const subSize = Math.round(h * 0.03);
        this.add.text(w / 2, h * 0.20, 'Ricardo Filipe Rio Pereira — Nº 29734', {
            fontFamily: 'Arial',
            fontSize: `${subSize}px`,
            color: '#d0eef6'
        }).setOrigin(0.5);

        // array para guardar referências aos rects dos botões (para Enter)
        this.buttons = [];

        // função que cria um botão estático (dimensões relativas)
        const makeButton = (yRatio, label, callback) => {
            const width = Math.round(w * 0.45);
            const height = Math.round(h * 0.11);
            const x = w / 2;
            const y = h * yRatio;

            // container para agrupar bg + texto
            const container = this.add.container(x, y);

            // rect de fundo — torná-lo interativo
            const bg = this.add.rectangle(0, 0, width, height, 0x1a8fbf).setOrigin(0.5);
            bg.setInteractive({ useHandCursor: true });

            // texto centrado sobre o botão (tamanho relativo)
            const textSize = Math.max(12, Math.round(h * 0.04));
            const text = this.add.text(0, 0, label, {
                fontFamily: 'Arial',
                fontSize: `${textSize}px`,
                color: '#ffffff'
            }).setOrigin(0.5);

            // profundidade para texto sobre o rect
            bg.setDepth(1);
            text.setDepth(2);

            // adicionar ao container
            container.add([bg, text]);


            bg.on('pointerup', () => {
               
                if (label === 'Jogar') {
                    // cena mapa
                    if (this.scene.get('Mapa')) {
                        console.log('Iniciando cena "Mapa"');
                        this.scene.start('Mapa');
                    } 
                } else {
                    callback();
                }
            });
            bg.on('pointerover', () => bg.setFillStyle(0x17a6b9));
            bg.on('pointerout', () => bg.setFillStyle(0x1a8fbf));

            // guardar referência ao rect
            this.buttons.push(bg);

            return container;
        };

        // botão "Jogar" — inicia a cena Mapa
        makeButton(0.44, 'Jogar', () => {
            
            if (this.scene.get('Mapa')) this.scene.start('Mapa');
            
        });

        // botão "Instruções" — abre cena de instruções
        makeButton(0.60, 'Instruções', () => {
            this.scene.start('Instrucoes');
        });

        // texto rodapé (tamanho relativo)
        const footerSize = Math.max(10, Math.round(h * 0.025));
        this.add.text(w / 2, h * 0.90, 'Clique nos botões para jogar', {
            fontFamily: 'Arial',
            fontSize: `${footerSize}px`,
            color: '#bfeaf8'
        }).setOrigin(0.5);

        // musica de fundo 
        const audioPath = 'assets/sound/musicaFundo.mp3';

        // criar novo Audio e guardar em this.game
        this.game.bgAudio = this.game.bgAudio || new Audio(audioPath);
        this.backgroundMusic = this.game.bgAudio;
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;
        // tocar música
        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play();  
        }
       
    }

    
}
