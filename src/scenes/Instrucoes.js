
export class Instrucoes extends Phaser.Scene {
    constructor() {
        // construtor da cena Instrucoes
        super({ key: 'Instrucoes' });
    }

    create() {
        // obter dimensões da área de jogo
        const w = this.scale.width;
        const h = this.scale.height;

        // fundo simples que preenche todo o ecrã
        this.add.rectangle(0, 0, w, h, 0x0b2a3a).setOrigin(0);

        // título da cena de instruções (tamanho reduzido)
        const titleSize = Math.round(h * 0.06); // menor que antes
        this.add.text(w / 2, h * 0.10, 'Instruções', {
            fontFamily: 'Arial',
            fontSize: `${titleSize}px`,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // linhas de texto com as instruções (estático, PT-PT) — tamanhos reduzidos
        const lines = [
            'Objetivo:',
            '  - Procurar e resgatar o maior número possível de animais.',
            '',
            'Controlo:',
            '  - Teclas WASD ou setas para mover o jogador.',
            '',
            'Regras principais:',
            '  - Colidir com um animal: animal resgatado e pontuação aumenta.',
            '  - Colidir com obstáculos (armadilhas): perde vida.',
            '  - Existem dois níveis: Floresta (mais fácil) e Caverna (mais difícil).',
            '',
            'Pontuação e vidas:',
            '  - A pontuação final baseia-se no número de animais resgatados.',
            '  - Quando as vidas chegam a zero, o jogo termina.',
            '',
            'Voltar:',
            '  - Pressione o botão "Voltar" '
        ];

        // desenhar cada linha no ecrã com espaçamento fixo relativo e letra menor
        const startY = h * 0.18;
        const lineHeight = Math.round(h * 0.035); 
        const textSize = Math.max(11, Math.round(h * 0.025)); 
        const leftX = Math.round(w * 0.10);

        for (let i = 0; i < lines.length; i++) {
            this.add.text(leftX, startY + i * lineHeight, lines[i], {
                fontFamily: 'Arial',
                fontSize: `${textSize}px`,
                color: '#e6f7fa',
                align: 'left',
                wordWrap: { width: Math.round(w * 0.75) }
            }).setOrigin(0, 0);
        }

        // botão Voltar)
        const btnW = Math.round(w * 0.22);  
        const btnH = Math.round(h * 0.07);   
        const btnY = h * 0.94;               

        const bg = this.add.rectangle(w / 2, btnY, btnW, btnH, 0x1a8fbf).setOrigin(0.5);
        
        const btnTextSize = Math.max(11, Math.round(h * 0.03));
        const text = this.add.text(w / 2, btnY, 'Voltar', {
            fontFamily: 'Arial',
            fontSize: `${btnTextSize}px`,
            color: '#ffffff'
        }).setOrigin(0.5);

        
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerup', () => {
            this.scene.start('Start');
        });

       
    }
}
