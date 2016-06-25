
app.controller('game', function($scope, $interval, socket) {
    var game = new Phaser.Game(290, 400, Phaser.CANVAS, 'canvas', {preload: preload, create: create, update: update, render: render }); //350, 420
    function preload() {
        game.load.image('ballsprite', '/images/ball.png');
    }

    var outlineVertices = [1400,-3200 ,1000,-2200, 1400,-1900, 1400,-600,
        1100,-500, 1100,300, 700,300, 700,-500
        ,200,-160, 200,470, -200,470, -200,-160, 
        -700,-500, -700,300, -1100,300, -1100,-500,
        -1400,-600, -1400,-1900, -1000,-2200, -1400,-3200,

    ];

    var sprite;
    var jackpot = [-100, -1500, -50, -1490, 50, -1490, 100, -1500];
    var gutterVertices = [-200,320,200,320];
    var gutterVerticesR = [700,150,1100,150];
    var gutterVerticesL = [-700,150,-1100,150];
    var ballStart = [-1399, 0];

    var horizontalAdj = 1430;
    var verticleAdj = 3500;

    function AdjustField(tbl) {
        for (i=0; i < tbl.length; i++) {
            if (i % 2) {
                tbl[i] += verticleAdj; 
            } else {
                tbl[i] += horizontalAdj; 
            }
        }
    }
    AdjustField(outlineVertices);
    AdjustField(jackpot);
    AdjustField(gutterVertices);
    AdjustField(gutterVerticesR);
    AdjustField(gutterVerticesL);

    var ballBody;
    var PTM = 100; // conversion ratio for values in arrays above
    var needReset = false;
    var count = 0;
    var countL = 0;
    var countR = 0;
    var caption; 
    var captionL;
    var captionR;

    function create() {
        game.world.setBounds(0, -0, "100", "100");

        game.stage.backgroundColor = '#564285';
        game.stage.disableVisibilityChange = true;
        // Enable Box2D physics
        game.physics.startSystem(Phaser.Physics.BOX2D);

        // Make the ground body
        var mainBody = new Phaser.Physics.Box2D.Body(this.game, null, 0, 0, 0);

        game.physics.box2d.ptmRatio = 500;
        game.physics.box2d.gravity.y = 2500; // large gravity to make scene feel smaller
        game.physics.box2d.friction = 0.1;

        // Add bounce-less fixtures
        game.physics.box2d.restitution = 0.1;
        mainBody.addChain(outlineVertices);
        mainBody.addChain(jackpot);


        game.physics.box2d.restitution = 0.5;

        mainBody.addCircle(34, -700+horizontalAdj, -2800+verticleAdj);
        mainBody.addCircle(34, -250+horizontalAdj, -2800+verticleAdj);
        mainBody.addCircle(34, 250+horizontalAdj, -2800+verticleAdj);
        mainBody.addCircle(34, 700+horizontalAdj, -2800+verticleAdj);


        mainBody.addCircle(34, -500+horizontalAdj, -2200+verticleAdj);
        mainBody.addCircle(34, 0+horizontalAdj, -2200+verticleAdj);
        mainBody.addCircle(34, 500+horizontalAdj, -2200+verticleAdj);

        mainBody.addCircle(34, -750+horizontalAdj, -1500+verticleAdj);
        //mainBody.addCircle(34, -100, -1500);
        //mainBody.addCircle(34, 100, -1500);
        mainBody.addCircle(34, 750+horizontalAdj, -1500+verticleAdj);

        mainBody.addCircle(34, -400+horizontalAdj, -900+verticleAdj);
        //mainBody.addCircle(34, 0, -1100);
        mainBody.addCircle(34, 400+horizontalAdj, -900+verticleAdj);

        // Add gutter fixture
        gutterFixture = mainBody.addEdge(gutterVertices[0], gutterVertices[1], gutterVertices[2], gutterVertices[3]);
        gutterFixture.SetSensor(true);
        
        gutterFixtureL = mainBody.addEdge(gutterVerticesL[0], gutterVerticesL[1], gutterVerticesL[2], gutterVerticesL[3]);
        gutterFixtureL.SetSensor(true);

        gutterFixtureR = mainBody.addEdge(gutterVerticesR[0], gutterVerticesR[1], gutterVerticesR[2], gutterVerticesR[3]);
        gutterFixtureR.SetSensor(true);

            // Dynamic circle
     

        // ball
        game.physics.box2d.restitution = 0.2;



        ballBody = new Phaser.Physics.Box2D.Body(this.game, null, ballStart[0], ballStart[1]);
        ballBody.setCircle(100);
        ballBody.setFixtureContactCallback(gutterFixture, onHitGutter, this);
        ballBody.setFixtureContactCallback(gutterFixtureL, onHitGutterL, this);
        ballBody.setFixtureContactCallback(gutterFixtureR, onHitGutterR, this);
        ballBody.bullet = true;
        
        //captionL = game.add.text(5, 5, 'Left. ' + countL, { fill: '#ffffff', font: '14pt Arial' });
        //captionL.fixedToCamera = true;

        //caption = game.add.text(5, 25, 'Mid. ' + count, { fill: '#ffffff', font: '14pt Arial' });
        //caption.fixedToCamera = true;

        //captionR = game.add.text(5, 45, 'Right. ' + countR, { fill: '#ffffff', font: '14pt Arial' });
        //captionR.fixedToCamera = true;

    }

    var testing = {};
    var currpos = 0;
    var mid = false;
    var left = false;
    var right = false;

    function onHitGutterL(body1, body2, fixture1, fixture2, begin) {
        if (begin) {
            needReset = true; // this occurs inside the world Step, so don't do the actual reset here
            left = true;
        }
    }
    function onHitGutter(body1, body2, fixture1, fixture2, begin) {
        if (begin) {
            needReset = true; // this occurs inside the world Step, so don't do the actual reset here
            mid = true
            //console.log('begin');
        }
    }
    function onHitGutterR(body1, body2, fixture1, fixture2, begin) {
        if (begin) {
            needReset = true; // this occurs inside the world Step, so don't do the actual reset here
            right = true;
        }   
    }

    var alternate = true;
    function update() {

        if (needReset) {
            if (left) {
                countL++;
                testing[currpos] = "left";
                //$.post( "http://localhost:3000/solutions", { position: currpos, result: "left" } );
               
                console.log("post "+currpos+ " left");
                left = false; 
            } else if (mid) {
                count++;
                testing[currpos] = "middle";
                //$.post( "http://localhost:3000/solutions", { position: currpos, result: "middle" } );
                
                console.log("post "+currpos+ " mid");

                mid = false;
            } else if (right) {
                countR++;
                testing[currpos] = "right";
                //$.post( "http://localhost:3000/solutions", { position: currpos, result: "right" } );
                
                console.log("post "+currpos+ " right");
                right = false;
            }
            //captionL.text = 'Left. ' + countL/2;
            //caption.text = 'Mid. ' + count/2;
            //captionR.text = 'Right. ' + countR/2;
            needReset = false;
            
        }

    }

    socket.on('startState', function(data){
        console.log(data.ballx);
        if (typeof ballBody !== 'undefined') {
            currpos = data.ballx;
            ballBody.velocity.x = 0;
            ballBody.velocity.y = 0;
            ballBody.angularVelocity = 1;
            ballBody.x = data.ballx;
            ballBody.y = ballStart[1];
            needReset = false;
            ballBody.bullet = true;
            render();
        };
    });

    function render() {
        game.debug.box2dWorld();
    }
});

