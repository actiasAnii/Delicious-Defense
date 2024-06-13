//class load. used for preloading assets and some animations
class Load extends Phaser.Scene {
    constructor() 
    {
        super("loadScene");
    }

    preload() 
    {
        //set path for assets
        this.load.setPath("./assets/");

        ///////tile map and sheet assets

        //load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");

        //load tilemap information
        this.load.image("town_tiles", "tilemap-town_packed.png");

        this.load.tilemapTiledJSON("level", "Level.tmj");//level tilemap in JSON
        this.load.tilemapTiledJSON("endScreen", "EndScreen.tmj"); //end screen template tilemap in JSON

        //load map tilemaps as spritesheets
        this.load.spritesheet("town_sheet", "tilemap-town_packed.png", {
            //px width/height
            frameWidth: 16,
            frameHeight: 16
        });


        //////load additional assets

        //donut :3
        this.load.image("donut", "donut_classic.png");
        //projectiles
        this.load.image("p_burger", "projectile_burger.png");
        this.load.image("p_musubi", "projectile_musubi.png");
        this.load.image("p_sushi", "projectile_sushi.png");
        //health bar
        this.load.image("heart_full", "health_full.png");
        this.load.image("heart_empty", "health_empty.png");
        //resource tracker
        this.load.image("coin_1", "coin_1.png");
        this.load.image("coin_2", "coin_2.png");
        //highlighted turrets
        this.load.image("hl_chara", "hl_c2.png");
        this.load.image("hl_enif", "hl_e2.png");
        this.load.image("hl_rigel", "hl_r2.png");
        //explosion/sparkles who can say
        this.load.image("sparkle1", "explosion_1.png");
        this.load.image("sparkle2", "explosion_2.png");
        this.load.image("sparkle3", "explosion_2.png");

        //load font
        this.load.bitmapFont("thick", "thick_8x8.png", "thick_8x8.xml");

        //load audio assets
        this.load.audio("soundPlace", "audio_click1.ogg"); //sound for placing a turret
        this.load.audio("soundPerish", "audio_jingle_09.ogg"); //sound for upgrading a turret
        this.load.audio("soundFire", "audio_laser_02.ogg"); //sound for turret firing
        this.load.audio("soundUP", "audio_jingle_03.ogg"); //sound for enemy death
        this.load.audio("soundWave", "audio_jingle_16.ogg"); //sound for start of a new wave
        this.load.audio("soundSwitch", "audio_switch_13.ogg"); //sound for switching selection
        this.load.audio("soundOuch", "audio_jingle_11.ogg"); //sound for losing health
        this.load.audio("soundError", "audio_jingle_02.ogg"); //sound for errors
        this.load.audio("soundLose", "audio_jingle_00.ogg"); //sound for losing the game
        this.load.audio("soundWin", "audio_jingle_12.ogg"); //sound for upgrading a turret


    }

    create()
    {
        //////////////create animations

        //////enemy animations

        //opportunity walking anim
        this.anims.create({
            key: 'oppyWalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 21,
                end: 22,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 4,
            repeat: -1
        });

        //spirit walking anim
        this.anims.create({
            key: 'spiritFlap',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 24,
                end: 26,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 5,
            repeat: -1
        });

        //sojourner walking anim
        this.anims.create({
            key: 'sojWalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 15,
                end: 16,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 4.5,
            repeat: -1
        });

        //curiosity walking anim
        this.anims.create({
            key: 'curiWalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 18,
                end: 19,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 5,
            repeat: -1
        });

        //perseverance walking anim
        this.anims.create({
            key: 'persWalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 11,
                end: 12,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 2,
            repeat: -1
        });

        ///////turret animations

        //chara turret anim
        this.anims.create({
            key: 'turrChara',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 2,
            repeat: -1
        });

        //enif turret anim
        this.anims.create({
            key: 'turrEnif',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 4,
                end: 5,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 2,
            repeat: -1
        });

        //rigel turret anim
        this.anims.create({
            key: 'turrRigel',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 2,
                end: 3,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 2,
            repeat: -1
        });

        //frisk anim
        this.anims.create({
            key: 'friskHop',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 6,
                end: 7,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 3,
            repeat: -1
        });

        ///////misc minor animations

        //coin flipping anim
        this.anims.create({
            key: 'coinFlip',
            frames:[
                { key: 'coin_1' },
                { key: 'coin_2' }
            ],
            frameRate: 2.5,
            repeat: -1

        });

        //enemy defeat anim
        this.anims.create({
            key: 'perish',
            frames: [
                { key: 'sparkle1' },
                { key: 'sparkle2' },
                { key: 'sparkle3' }

            ],
            frameRate: 16,
            repeat: 3,
            hideOnComplete: true
        });

        

        ///////pass to next scene
        this.scene.start("mainLevel");
    }

    //never reached
    update()
    {

    }
}