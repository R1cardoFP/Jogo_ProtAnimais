export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key = 'player', frame = 6) {
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        if (this.body && this.body.setSize) {
            this.body.setSize(10, 12);
            this.body.setOffset(3, 4);
        }
        this.setDepth(50);

        // health
        this.health = 3;   
        this.invulnerable = false;
    }

    update(cursors) {
        if (!this.body) return;
        this.body.setVelocity(0);
        const speed = 80;

        if (cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (cursors.right.isDown) this.body.setVelocityX(speed);
        if (cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (cursors.down.isDown) this.body.setVelocityY(speed);

        if (cursors.up.isDown) {
            this.anims.play('up', true);
            this.flipX = false;
        } else if (cursors.down.isDown) {
            this.anims.play('down', true);
            this.flipX = false;
        } else if (cursors.left.isDown) {
            this.anims.play('esquerdadireita', true);
            this.flipX = true;
        } else if (cursors.right.isDown) {
            this.anims.play('esquerdadireita', true);
            this.flipX = false;
        } else {
            this.anims.stop();
            this.setFrame(0);
        }
    }


    takeDamage(amount = 1) {
        if (this.invulnerable) return;
        this.health = Math.max(0, this.health - amount);

     
        if (this.scene && typeof this.scene.updateTopText === 'function') {
            this.scene.updateTopText();
        }

        this.invulnerable = true;
        this.setTint(0xff4444);
        // breve efeito e invulnerabilidade
        this.scene.time.delayedCall(500, () => {
            this.clearTint();
            this.invulnerable = false;
        });

        if (this.health <= 0) {
            // desativar jogador e ir directamente para GameOver, mostrando cães resgatados
            if (this.body) this.body.enable = false;
            this.setVisible(false);

            // obtém número de cães resgatados da Scene
            const rescued = (this.scene && typeof this.scene.rescuedCount !== 'undefined') ? this.scene.rescuedCount : 0;

            // iniciar GameOver 
            if (this.scene && this.scene.scene && typeof this.scene.scene.start === 'function') {
                this.scene.scene.start('GameOver', { rescued });
            }
        }
    }
}