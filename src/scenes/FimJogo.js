export default class FimJogo extends Phaser.Scene {
    constructor() {
        super('FimJogo');
    }

    create(data) {
        const w = this.scale.width;
        const h = this.scale.height;

        // fundo azul escuro 
        this.add.rectangle(0, 0, w, h, 0x0b2a3a).setOrigin(0);

        const titleSize = Math.round(h * 0.08);
        this.add.text(w / 2, h * 0.14, 'Fim de Jogo', {
            fontFamily: 'Arial',
            fontSize: `${titleSize}px`,
            color: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // mostrar mensagem com contagens
        const rescuedFromMap = data && typeof data.rescuedFromMap !== 'undefined' ? data.rescuedFromMap : 0;
        const rescuedInCave = data && typeof data.rescuedInCave !== 'undefined' ? data.rescuedInCave : 0;
        const total = data && typeof data.totalRescued !== 'undefined' ? data.totalRescued : (rescuedFromMap + rescuedInCave);

        const subSize = Math.round(h * 0.03);
        this.add.text(w / 2, h * 0.28, `Resgatou todos os animais!`, {
            fontFamily: 'Arial',
            fontSize: `${subSize}px`,
            color: '#dfffcf',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.36, `Do mapa: ${rescuedFromMap}    Na caverna: ${rescuedInCave}`, {
            fontFamily: 'Arial',
            fontSize: `${subSize}px`,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.44, `Total resgatados: ${total}`, {
            fontFamily: 'Arial',
            fontSize: `${subSize}px`,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // botão para voltar ao início
        const btnW = Math.round(w * 0.4);
        const btnH = Math.round(h * 0.10);
        const container = this.add.container(w / 2, h * 0.7);
        const bg = this.add.rectangle(0, 0, btnW, btnH, 0x1a8fbf).setOrigin(0.5);
        bg.setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, 0, 'Voltar ao Início', { fontFamily: 'Arial', fontSize: `${Math.round(h * 0.04)}px`, color: '#fff' }).setOrigin(0.5);
        container.add([bg, txt]);

        bg.on('pointerup', () => {
            this.scene.start('Start');
        });
        bg.on('pointerover', () => bg.setFillStyle(0x17a6b9));
        bg.on('pointerout', () => bg.setFillStyle(0x1a8fbf));
    }
}
