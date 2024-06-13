// Anais Montes
// Created: 06/2024
// Phaser: 3.70.0
//
//
//
//Intergalactics and Gastronomy: Delicious Defense !!!
//
//
//Credits: 
// 
//
//art:
//- Kenney Pixel Platformer (https://kenney.nl/assets/pixel-platformer)
//- Kenney Pixel Platformer Food Expansion (https://kenney.nl/assets/pixel-platformer-food-expansion)
//- Kenney Pixel Shmup (https://kenney.nl/assets/tiny-battle)
//- Kenney Tiny Town (https://kenney.nl/assets/tiny-town)
//- + use of Phaser EasyStar Pathfinding library (https://github.com/prettymuchbryce/easystarjs)
//
//audio:
//- Kenney Sci Fi Sounds (https://kenney.nl/assets/sci-fi-sounds)
//- Kenney Music Jingles (https://kenney.nl/assets/music-jingles)
//- Kenney UI Audio (https://kenney.nl/assets/ui-audio)
//
//font:
//FrostyFreeze Public Domain Bitmap Fonts (https://frostyfreeze.itch.io/pixel-bitmap-fonts-png-xml)

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true,  // prevent pixel art from getting blurred when scaled
        antialias: false, //prevent that weird jitter when player moves fast
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            },
            fixedStep: false
        }
    },
    width: 1840,
    height: 872, 
    scene: [Load, Level, WinScreen, LoseScreen]
}

const SCALE = 2.1; //use for camera zoom and calculations

var my = {sprite: {}, text: {}, vfx: {}};

const game = new Phaser.Game(config);