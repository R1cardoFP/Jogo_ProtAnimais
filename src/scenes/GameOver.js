export default class GameOver extends Phaser.Scene {
	constructor() {
		super('GameOver');
	}

	create(data) {
		const w = this.scale.width;
		const h = this.scale.height;

		// fundo igual ao Start 
		this.add.rectangle(0, 0, w, h, 0x0b2a3a).setOrigin(0);

		// títulO
		const titleSize = Math.round(h * 0.09);
		this.add.text(w / 2, h * 0.12, 'GAME OVER', {
			fontFamily: 'Arial',
			fontSize: `${titleSize}px`,
			color: '#ff6666',
			align: 'center'
		}).setOrigin(0.5);

		// mostrar cães resgatados
		const rescued = data && typeof data.rescued !== 'undefined' ? data.rescued : null;
		const deaths = data && typeof data.deaths !== 'undefined' ? data.deaths : null;
		const infoText = rescued !== null ? `Cães resgatados: ${rescued}` : `Mortes: ${deaths || 0}`;
		const subSize = Math.round(h * 0.03);
		this.add.text(w / 2, h * 0.22, infoText, {
			fontFamily: 'Arial',
			fontSize: `${subSize}px`,
			color: '#ffffff',
			align: 'center'
		}).setOrigin(0.5);


        // função para criar botões
		const makeButton = (yRatio, label, callback) => {
			const width = Math.round(w * 0.45);
			const height = Math.round(h * 0.11);
			const x = w / 2;
			const y = h * yRatio;

			const container = this.add.container(x, y);

			const bg = this.add.rectangle(0, 0, width, height, 0x1a8fbf).setOrigin(0.5);
			bg.setInteractive({ useHandCursor: true });

			const textSize = Math.max(12, Math.round(h * 0.04));
			const text = this.add.text(0, 0, label, {
				fontFamily: 'Arial',
				fontSize: `${textSize}px`,
				color: '#ffffff'
			}).setOrigin(0.5);

			bg.on('pointerup', callback);
			bg.on('pointerover', () => bg.setFillStyle(0x17a6b9));
			bg.on('pointerout', () => bg.setFillStyle(0x1a8fbf));

			container.add([bg, text]);
			return container;
		};

		// botão Reiniciar
		makeButton(0.48, 'Reiniciar Jogo', () => {
			this.scene.start('Mapa');
		});

		// botão Voltar ao Menu
		makeButton(0.64, 'Voltar ao Menu', () => {
			this.scene.start('Start');
		});

		
		const footerSize = Math.max(10, Math.round(h * 0.025));
		this.add.text(w / 2, h * 0.92, 'Pressione Enter para Reiniciar, Esc para Menu', {
			fontFamily: 'Arial',
			fontSize: `${footerSize}px`,
			color: '#bfeaf8'
		}).setOrigin(0.5);

		// atalhos de teclado
		this.input.keyboard.on('keydown-ENTER', () => this.scene.start('Mapa'));
		this.input.keyboard.on('keydown-ESC', () => this.scene.start('Start'));
	}
}
