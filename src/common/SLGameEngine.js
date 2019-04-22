import { GameEngine, CannonPhysicsEngine, ThreeVector } from 'lance-gg';
import CarControl from './CarControl';
import Car from './Car';
import Ball from './Ball';
import Arena from './Arena';


// todo check if this should be global
let CANNON = null;

export default class SLGameEngine extends GameEngine {

    constructor(options) {
        super(options);

        this.log = [];
        this.physicsEngine = new CannonPhysicsEngine({ gameEngine: this });
        CANNON = this.physicsEngine.CANNON;
        this.carControl = new CarControl({ CANNON });

        this.numCars = 0;
        this.numBalls = 0;
        this.metaData= {
            teams: {
                red: {
                    players: [],
                    score: 0
                },
                blue: {
                    players: [],
                    score: 0
                }
            }
        };

        this.on('server__init', this.gameInit.bind(this));
    }

    gameInit() {
        this.arena = new Arena(this);
        this.arena.position.y = -15.4;
        this.addObjectToWorld(this.arena);
    }

    start() {
        super.start();
    }


    // the Sprocket League Game Engine Step.
    step(isReenact, t, dt, physicsOnly) {
        super.step(isReenact, t, dt, physicsOnly);

        // car physics
        this.world.forEachObject((id, o) => {
            if (o.class === Car) {
                o.adjustCarMovement();
            }
        });

        // check if a goal has been made
        if (this.ball && this.arena) {
            if (this.arena.isObjInGoal1(this.ball)) {
                console.log('Ball in goal 1');
                this.ball.showExplosion();
                this.resetBall();
                this.metaData.teams.red.score++;
                this.emit('scoreChange');
            }

            if (this.arena.isObjInGoal2(this.ball)) {
                console.log('Ball in goal 2');
                this.ball.showExplosion();
                this.resetBall();
                this.metaData.teams.blue.score++;
                this.emit('scoreChange');
            }
        }
    }

    registerClasses(serializer) {
        serializer.registerClass(Car);
        serializer.registerClass(Ball);
        serializer.registerClass(Arena);
    }

    // server-side function to add a new player
    makeCar(playerId, team) {
        console.log(`adding car of player`, playerId);

        let existingCar = this.world.queryObject({ playerId });
        if (existingCar) {
            // this.log.push(`player[${playerId}] already has car[${existingCar.id}]`);
            return existingCar;
        }

        // create a car for this client
        let x = Math.random() * 20 - 10;
        let z = Math.random() * 20 - 10;
        let position = new ThreeVector(x, 10, z);
        let car = new Car(this, position);
        car.playerId = playerId;
        car.team = team;
        this.addObjectToWorld(car);
        this.numCars++;
        // this.log.push(`new car [${car.id}] for player[${playerId}]`);
        if (this.numCars === 1)
            this.makeBall();

        return car;
    }

    makeBall() {
        if (this.numBalls === 1)
            return;

        console.log(`adding ball`);
        let position = new ThreeVector(20, 10, 0);
        this.ball = new Ball(this, position);
        this.ball.playerId = 0;
        this.numBalls++;
        this.addObjectToWorld(this.ball);
    }

    resetBall() {
        this.ball.position.set(0, 10, 0);
        this.ball.velocity.set(0, 0, 0);
        this.ball.angularVelocity.set(0, 0, 0);
        this.ball.refreshToPhysics();
    }

    removeCar(playerId) {
        console.log(`removing car of player`, playerId);
        // this.log.push(`removing objects for player[${playerId}]`);
        let o = this.world.queryObject({ playerId });
        if (o) {
            // this.log.push(`removing car [${o.id}] for player[${playerId}]`);
            this.removeObjectFromWorld(o.id);
            this.numCars--;
        }
        if (this.numCars == 0) {
            this.metaData.teams.red.score = 0;
            this.metaData.teams.blue.score = 0;
        }
    }

    processInput(inputData, playerId) {
        super.processInput(inputData, playerId);
        let playerCar = this.world.queryObject({ playerId });
        if (playerCar) {
            if (['up', 'down'].includes(inputData.input)) this.carControl.accelerate(playerCar, inputData.input);
            if (['right', 'left'].includes(inputData.input)) this.carControl.turn(playerCar, inputData.input);
            playerCar.refreshFromPhysics();
        }
    }
}
