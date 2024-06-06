//class load. used for preloading assets some animations
class Load extends Phaser.Scene {
    constructor() 
    {
        super("loadScene");
    }

    preload() 
    {

    }

    create()
    {



        //pass to next scene
        this.scene.start("mainLevel");
    }

    //never reached
    update()
    {

    }
}