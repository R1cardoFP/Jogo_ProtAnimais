import { Start } from './scenes/Start.js';
import Mapa from './scenes/Mapa.js';
import { Instrucoes } from './scenes/Instrucoes.js';
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1152,            
    height: 648,            
    backgroundColor: '#000000',
    pixelArt: true,            
    physics: {
        default: 'arcade',
        arcade: {
        gravity: { 
            y: 0 
        },
         debug: true
        }
        
    },
    scene: [ 
        Start,
        Mapa,
        Instrucoes 
    ],
    scale: { 
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
 }
};

window.game = new Phaser.Game(config);
