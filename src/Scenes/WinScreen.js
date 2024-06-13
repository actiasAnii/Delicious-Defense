class WinScreen extends Phaser.Scene{
    constructor()
    {
        super("endWin");
    }

    preload()
    {

    }

    create()
    {

        //set up map
        this.map = this.add.tilemap("endScreen", 16, 16, 55, 26);

        //add tilesets to map
        this.town_tileset = this.map.addTilesetImage("tilemap-town_packed", "town_tiles");

        //create layers
        this.groundLayer = this.map.createLayer("Ground-n-Paths", [this.town_tileset], 0, 0).setDepth(-100);
        this.decorationLayer = this.map.createLayer("Decoration", [this.town_tileset], 0, 0).setDepth(-100);

        //create camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(SCALE);

        //sprites to create unique scene
        my.sprite.donut = this.add.sprite(this.map.widthInPixels/2, 200, "donut").setScale(2.7);

        my.sprite.frisk = this.add.sprite(this.map.widthInPixels/2, 255, "platformer_characters", "tile_0006.png").setScale(1.5);
        my.sprite.frisk.anims.play('friskHop');

        my.sprite.enif = this.add.sprite(this.map.widthInPixels/2 + 60, 200, "platformer_characters", "tile_0004.png").setScale(1.5);
        my.sprite.enif.anims.play('turrEnif');

        my.sprite.rigel = this.add.sprite(this.map.widthInPixels/2 - 60, 200, "platformer_characters", "tile_0002.png").setScale(1.5);
        my.sprite.rigel.anims.play('turrRigel');

        my.sprite.chara = this.add.sprite(this.map.widthInPixels/2, 140, "platformer_characters", "tile_0000.png").setScale(1.5);
        my.sprite.chara.anims.play('turrChara');


        //text
        my.text.won = this.add.bitmapText(this.map.widthInPixels/2, 32, "thick", "YOU'VE PROTECTED THE DONUTVERSE!").setOrigin(0.5).setScale(2);
        my.text.wPlayAgain = this.add.bitmapText(this.map.widthInPixels/2, 400, "thick", "press N to play again!").setOrigin(0.5).setScale(1.4);

        //N to replay
        this.input.keyboard.on('keydown-N', () => {
            this.scene.start("mainLevel")
        }, this);

    }

    update()
    {
        
    }
}