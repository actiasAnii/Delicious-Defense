class LoseScreen extends Phaser.Scene{
    constructor()
    {
        super("endLose");
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
 
         //sprites to create the unique scene
         my.sprite.friskSad = this.add.sprite(340, 240, "platformer_characters", "tile_0007.png").setScale(1.2).setAngle(90);
         my.sprite.friskSad.angle = -90;

         my.sprite.opportunity = this.add.sprite(450, 155, "platformer_characters", "tile_0021.png").setScale(1);
         my.sprite.opportunity.flipX = true;
         my.sprite.opportunity.anims.play("oppyWalk");

         my.sprite.spirit = this.add.sprite(480, 122, "platformer_characters", "tile_0024.png").setScale(1);
         my.sprite.spirit.flipX = true;
         my.sprite.spirit.anims.play("spiritFlap");

         my.sprite.perseverance = this.add.sprite(520, 190, "platformer_characters", "tile_0011.png").setScale(1.3);
         my.sprite.perseverance.anims.play("persWalk");

         my.sprite.sojourner = this.add.sprite(465, 187, "platformer_characters", "tile_0015.png").setScale(1.2);
         my.sprite.sojourner.flipX = true;
         my.sprite.sojourner.anims.play("sojWalk");

         my.sprite.curiosity = this.add.sprite(520, 135, "platformer_characters", "tile_0018.png").setScale(1.1);
         my.sprite.curiosity.anims.play("curiWalk");

         my.sprite.stolenDonut = this.add.sprite(490, 160, "donut").setScale(2.5);
 
 
         //text
         my.text.lost = this.add.bitmapText(this.map.widthInPixels/2, 32, "thick", "THE DONUTVERSE HAS CRUMBLED!").setOrigin(0.5).setScale(2);
         my.text.lPlayAgain = this.add.bitmapText(this.map.widthInPixels/2, 400, "thick", "press N to try again!").setOrigin(0.5).setScale(1.4);

         //N to replay
         this.input.keyboard.on('keydown-N', () => {
            this.scene.start("mainLevel")
         }, this);

    }

    update()
    {
        
    }
}