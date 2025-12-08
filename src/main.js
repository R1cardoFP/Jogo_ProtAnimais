import { Start } from './scenes/Start.js';
import Mapa from './scenes/Mapa.js';
import GameOver from './scenes/GameOver.js';
import Caverna from './scenes/Caverna.js';
import FimJogo from './scenes/FimJogo.js';
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
         debug: false
        }
        
    },
    scene: [ 
        Start,
        Mapa,
        GameOver,
        Caverna,
        FimJogo,
        Instrucoes 
    ],
    scale: { 
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
 }
};

window.game = new Phaser.Game(config);
