let populationChart;
let chartData = {
  labels: [], // Time or another metric for x-axiss
  datasets: [{
    label: 'Prey',
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    borderColor: 'rgba(0, 255, 0, 1)',
    data: []
  }, {
    label: 'Predators',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderColor: 'rgba(255, 0, 0, 1)',
    data: []
  }, {
    label: 'Carcasses',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(0, 0, 0, 1)',
    data: []
  }]
};


function updateChartData() {
  // Push new frame count (or time) to the labels array
  chartData.labels.push(frameCount / 60); // Assuming 60 FPS for 1 label per second
  
  // Push current populations to the data arrays
  chartData.datasets[0].data.push(prey.length);
  chartData.datasets[1].data.push(predators.length);
  chartData.datasets[2].data.push(carcasses.length);

  // Ensure the chart only shows a fixed number of data points
  const maxDataPoints = 60; // For example, last 60 data points
  if (chartData.labels.length > maxDataPoints) {
    chartData.labels.shift();
    chartData.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
  }

  // Update the chart with new data
  populationChart.update();
}

let graphVisible = false; // Initialize the variable

function keyPressed() {
  if (key === 'g' || key === 'G') {
    graphVisible = !graphVisible;

    // Get the chart container element by its ID
    let chartContainer = document.getElementById('chart-container'); 

    // Toggle the display style based on graphVisible
    if (graphVisible) {
      chartContainer.style.display = 'block'; // Show the chart
    } else {
      chartContainer.style.display = 'none'; // Hide the chart
    }
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

let zoomLevel = 1; // Start with no zoom

function mouseWheel(event) {
  // Update zoom level based on mouse wheel movement
  zoomLevel += event.delta * -0.001;
  // Constrain the zoom level to not go below the initial state (1)
  zoomLevel = constrain(zoomLevel, 1, 3); // Adjust the max zoom as needed
  return false; // Prevent default scrolling behavior
}

let offsetX = 0;
let offsetY = 0;
let dragging = false;
let prevMouseX, prevMouseY;

function mousePressed() {
  dragging = true;
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function mouseReleased() {
  dragging = false;
}
function doubleClicked() {
  zoomLevel = 1; // Reset zoom to initial level
  offsetX = 0; // Reset horizontal offset
  offsetY = 0; // Reset vertical offset
}

// Enhanced Ecosystem Simulation: Prey and Predator
// Global array for carcasses
let carcasses = [];
let prey = [];
let predators = [];
let barriers = []; // Global array for barriers
const INITIAL_PREY_COUNT = 20;
const INITIAL_PREDATOR_COUNT = 2;
const PREY_REPRODUCTION_RATE = 0.01; // Chance for prey to reproduce each frame
const PREDATOR_REPRODUCTION_RATE = 0.5; // Chance for predators to reproduce after eating
// Constants for energy costs and population c
const ENERGY_COST_MOVE_PREY = 0.5;
const ENERGY_COST_REPRODUCE_PREY = 2;
const MAX_PREY = 1666;
// Constants for pack behavior and barrier avoidance
const PACK_FORMATION_DISTANCE = 100; // Distance within which predators form a pack
const MAX_PACK_SIZE = 5; // Maximum number of predators in a pack
const FOLLOWER_LERP_FACTOR = 0.05; // How closely followers mimic the leader's movement
const BARRIER_AVOIDANCE_DISTANCE = 50; // Distance within which predators avoid barriers
const BARRIER_AVOIDANCE_FORCE = 0.5; // Force applied for barrier avoidance
// Predator class with updated hunting and lifespan 
// Constants for energy costs and population caps
const ENERGY_COST_MOVE_PREDATOR = 1;
const ENERGY_GAIN_EAT_PREY = 50;
const MAX_PREDATORS = 333;

let startTime; // Declare startTime globally

function setup() {
  // Setup for Ecosystem Simulation
  createCanvas(windowWidth, windowHeight);
  
  // Initialize prey and predators
  for (let i = 0; i < INITIAL_PREY_COUNT; i++) {
    prey.push(new Prey(random(width), random(height)));
  }
  for (let i = 0; i < INITIAL_PREDATOR_COUNT; i++) {
    predators.push(new Predator(random(width), random(height)));
  }

  // Initialize Chart.js
  let ctx = document.getElementById('populationChart').getContext('2d');
  populationChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      // Add your Chart.js options here
    }
  });

  // Set initial time for the simulatio
  startTime = millis();
}




let simulationRunning = true;
let winMessage = '';
let endTime;
let city;
let barrierThreshold = 10; // Example threshold
let ufo;
let mushrooms = []; // Global array for mushrooms

function draw() {
  background(200);

  // Translate and scale for zoom
  translate(width / 2, height / 2);
  scale(zoomLevel);
  translate(-width / 2, -height / 2);
//handle click viewing
  if (dragging) {
    offsetX += mouseX - prevMouseX;
    offsetY += mouseY - prevMouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }

  translate(offsetX, offsetY);
  // Handle ecosystem entities and behaviors if the simulation is running
  if (simulationRunning) {
    // Update and display carcasses
    for (let i = carcasses.length - 1; i >= 0; i--) {
      carcasses[i].display();
      if (carcasses[i].update()) {
        carcasses.splice(i, 1);
      }
    }

    // Update and display prey
    for (let i = prey.length - 1; i >= 0; i--) {
      let newPrey = prey[i].reproduce();
      if (newPrey) {
        prey.push(newPrey);
      }
      prey[i].move();
      prey[i].display();
      if (prey[i].lifespan <= 0) {
        prey.splice(i, 1);
      }

      // Prey dropping barriers
      if (prey[i] && prey[i].canDropBarrier) {
        prey[i].dropBarrier();
      }
    }

    // Update and display predators
    for (let i = predators.length - 1; i >= 0; i--) {
      predators[i].move(prey);
      predators[i].display();
      if (predators[i].lifespan <= 0) {
        carcasses.push(new Carcass(predators[i].position.x, predators[i].position.y));
        predators.splice(i, 1);
      }
    }

    // Handle barriers
    for (let i = barriers.length - 1; i >= 0; i--) {
      barriers[i].display();
      if (barriers[i].update()) {
        console.log('Removing Barrier'); // Debugging line
        barriers.splice(i, 1);
      }
    }
// Check if barriers turn into mushrooms
for (let i = barriers.length - 1; i >= 0; i--) {
  let nearbyPredators = predators.filter(predator => 
    dist(predator.position.x, predator.position.y, barriers[i].position.x, barriers[i].position.y) < 50
  );

  if (nearbyPredators.length >= 10 && mushrooms.length < 6) {
    mushrooms.push(new Mushroom(barriers[i].position.x, barriers[i].position.y));
    barriers.splice(i, 1); // Remove the barrier
  }
}

// Update and display mushrooms
for (let i = mushrooms.length - 1; i >= 0; i--) {
  mushrooms[i].display();
  if (mushrooms[i].update()) {
    mushrooms.splice(i, 1); // Remove the mushroom if its lifespan is over
  }
}

    // Check if barriers reach the threshold and city doesn't exist
    if (barriers.length >= barrierThreshold && !city) {
      let x = random(width);
      let y = random(height);
      city = new City(x, y);
    }

    // Handle city logic
    if (city) {
      let closestPredator = null;
      let recordDistance = Infinity;

      for (let predator of predators) {
        let d = city.position.dist(predator.position);
        if (d < city.protectiveRange && d < recordDistance) {
          recordDistance = d;
          closestPredator = predator;
        }
      }

      if (closestPredator) {
        city.fireProjectile(closestPredator);
      }

      city.dispensePrey();
      city.display();
    }

    // Create UFO once a city is created
    if (city && !ufo) {
      ufo = new UFO();
    }

    // Handle UFO logic
    if (ufo) {
      ufo.move();

      let closestPredatorToUFO = null;
      let recordDistanceToUFO = Infinity;

      for (let predator of predators) {
        let d = ufo.position.dist(predator.position);
        if (d < recordDistanceToUFO) {
          recordDistanceToUFO = d;
          closestPredatorToUFO = predator;
        }
      }

      if (ufo) {
        ufo.move();
        // The ray gun logic is now inside the UFO's move method, 
        // so we don't need to manually call fireProjectile
      }

      ufo.display();
    }

    // Check for win condition
    if (prey.length === 0) {
      simulationRunning = false;
      winMessage = 'PREDATORS WIN';
      endTime = millis();
      startCountdown();
    } else if (predators.length === 0) {
      simulationRunning = false;
      winMessage = 'PREY WINS';
      endTime = millis();
      startCountdown();
    }

    // Update the chart data every second
    if (frameCount % 60 == 0) {
      updateChartData();
    }
  }

  // Display stats and win message
  displayStats();
  if (!simulationRunning) {
    displayWinMessage();
  }
  
}



function displayStats() {
  fill(255); // White text
  textSize(16);
    textAlign(LEFT, TOP); // Ensures the text is aligned to the top left
  text(`Current Predators: ${predators.length}`, 10, 20);
  text(`Current Prey: ${prey.length}`, 10, 40);
text(`Peak Predators: ${peakPredators}`, 10, 60);
text(`Peak Prey: ${peakPrey}`, 10, 80);


  // Update peak values
  peakPredators = max(peakPredators, predators.length);
  peakPrey = max(peakPrey, prey.length);

  if (!simulationRunning) {
    text(`Restarting in: ${countdown} seconds`, 10, 100);
  }
}

function displayWinMessage() {
  textSize(32);
  fill(255, 0, 0); // Red color for the win message
  textAlign(CENTER, CENTER);
  text(winMessage, width / 2, height / 2);
  textSize(16);
  text(`Total Time: ${(endTime - startTime) / 1000} seconds`, width / 2, height / 2 + 30);
  text(`Total Prey Born: ${totalPreyBorn}`, width / 2, height / 2 + 50);
  text(`Total Predators Born: ${totalPredatorsBorn}`, width / 2, height / 2 + 70);
text(`Max Prey at One Time: ${peakPrey}`, width / 2, height / 2 + 90);
text(`Max Predators at One Time: ${peakPredators}`, width / 2, height / 2 + 110);

}

let countdown = 60; // Set the countdown duratio
function startCountdown() {
  let countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      resetSimulation();
    }
  }, 1000);
}

let totalPreyBorn = 0;
let totalPredatorsBorn = 0;


function runEcosystem() {
  for (let p of prey) {
    p.behave(predators);
    p.display();
  }
  for (let i = predators.length - 1; i >= 0; i--) {
    if (predators[i].hunt(prey)) {
      let newPredator = predators[i].reproduce();
      if (newPredator) predators.push(newPredator);
    }
    predators[i].display();
  }
}

let peakPrey = 0;
let peakPredators = 0;




class Prey {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(random(2));
    this.lifespan = 255;
    this.energy = 100;
    this.reproductionRate = PREY_REPRODUCTION_RATE;
    this.size = 8;
    this.reproductionCooldown = 0;
    this.bumpCounter = 0;
    this.canDropBarrier = false;
    this.hasBumped = false; // New property to track barrier bumps
  }

  move() {
    this.position.add(this.velocity);
    this.edges();
    this.lifespan -= 0.4;
    this.energy -= ENERGY_COST_MOVE_PREY;
    if (this.energy <= 0) this.lifespan = 0;
    this.applyBehaviors();
    this.scavengeCarcasses();
    this.avoidBarriers();
    this.velocity.limit(3);
  }

  applyBehaviors() {
    let steer = p5.Vector.random2D();
    steer.mult(random(0.5));
    this.velocity.add(steer);
    this.velocity.limit(3); // Limit the velocity for more natural movement
  }

  display() {
    if (this.hasBumped) {
      fill(173, 216, 230, this.lifespan); // Light blue color
    } else {
      fill(0, 255, 0, this.lifespan); // Original green color
    }
    push();
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading());
    ellipse(0, 0, this.size * 0.5, this.size);
    pop();
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }

  reproduce() {
    if (this.reproductionCooldown <= 0 && random(1) < this.reproductionRate && prey.length < MAX_PREY) {
      this.energy -= ENERGY_COST_REPRODUCE_PREY;
      if (this.energy <= 0) {
        this.lifespan = 0;
        return null;
      }
      this.reproductionCooldown = 60; // Cooldown period after reproducing
      this.isReproducing = true; // Flag for reproducing status
      setTimeout(() => (this.isReproducing = false), 500); // Reset the flag after a delay

      totalPreyBorn++;
      return new Prey(this.position.x + random(-20, 20), this.position.y + random(-20, 20));
    }
    this.reproductionCooldown--;
    return null;
  }

  scavengeCarcasses() {
    for (let i = carcasses.length - 1; i >= 0; i--) {
      let carcass = carcasses[i];
      let d = this.position.dist(carcass.position);
      if (d < 20) { // If within 'eating' distance
        carcasses.splice(i, 1); // Remove carcass
        this.energy += 30;
        this.bumpCounter++;
        console.log('Bump Counter: ', this.bumpCounter); // Debugging line

        if (this.bumpCounter >= 3) { // Reduce the number of carcasses needed to trigger barrier creation
          this.bumpCounter = 0; // Reset bump counter
          if (random() < 0.5) { // Increase the chance to drop a barrier to 50%
            this.canDropBarrier = true;
            console.log('Dropping Barrier'); // Debugging line
            this.dropBarrier();
          }
        }
        break;
      }
    }
  }

  dropBarrier() {
    if (this.canDropBarrier) {
      console.log('Barrier Created'); // Debugging line
      barriers.push(new Barrier(this.position.x, this.position.y, frameCount)); // Pass the current frame count
      this.canDropBarrier = false; // Reset the flag
    }
  }


  avoidBarriers() {
    let avoidanceForce = createVector(0, 0);
    let count = 0;

    for (let barrier of barriers) {
      let d = this.position.dist(barrier.position);
      if (d < 20) { // Adjust as needed based on your simulation's scale
        let diff = p5.Vector.sub(this.position, barrier.position);
        diff.normalize();
        diff.div(d); // Weight by distance
        avoidanceForce.add(diff);
        count++;
      }
    }

    if (count > 0) {
      this.bumpBarrier(); // Bump the barrier and apply effects
      avoidanceForce.div(count);
      avoidanceForce.setMag(3); // Set the magnitude of the avoidance force
      this.velocity.add(avoidanceForce);
    }
  }

  bumpBarrier() {
    // Increase energy and lifespan when bumping into a barrier
    this.energy += 500; // Adjust this value as needed
    this.lifespan += 500; // Adjust this value as needed

    // Ensure that energy and lifespan do not exceed their maximum values
    this.energy = min(this.energy, 100); // Assuming 100 is the max energy
    this.lifespan = min(this.lifespan, 500); // Assuming 255 is the max lifespan

    // Change color to light blue to indicate the prey has bumped a barrier
    this.hasBumped = true;
  }
}


class Predator {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(random(4, 6));
    this.lifespan = 255;
    this.energy = 100;
    this.size = 8;
    this.hunger = 0;
    this.baseSpeed = 3.65; // Normal speed
    this.boostedSpeed = 5.33; // Speed when boosted
    this.justAte = false; // Flag to indicate recent eating
    this.isLeader = false;
    this.pack = [];
  }

  move(preyList) {
    if (this.isLeader || this.pack.length === 0) {
      this.position.add(this.velocity);
      this.edges();
      this.lifespan -= 0.2;
      this.energy -= ENERGY_COST_MOVE_PREDATOR;
      if (this.energy <= 0) this.lifespan = 0;
      this.hunt(preyList);
      // Boost speed if predators are low in number
      if (predators.length <= 2) {
        this.boostSpeed();
      } else {
        this.normalSpeed();
      }
    } else {
      // Followers mimic the leader's movement
      let leader = this.pack[0]; // Assuming the first in the list is the leader
      this.position.lerp(leader.position, FOLLOWER_LERP_FACTOR);
    }

    // Avoid barriers
    this.avoidBarriers();
  }

  hunt(preyList) {
    if (this.isLeader || this.pack.length === 0) {
      let record = Infinity;
      let closest = null;
      for (let i = preyList.length - 1; i >= 0; i--) {
        let d = this.position.dist(preyList[i].position);
        if (d < record) {
          record = d;
          closest = preyList[i];
        }

        if (d < this.size / 2 + preyList[i].size / 2) {
          preyList.splice(i, 1);
          this.energy += ENERGY_GAIN_EAT_PREY;
          this.hunger++;
          if (this.hunger >= 2 && predators.length < MAX_PREDATORS) {
            this.reproduce();
            this.hunger = 0;
            this.justAte = true;
            setTimeout(() => this.justAte = false, 500); // Reset flag after 500 milliseconds
          }
          break;
        }
      }

      if (closest != null) {
        let pursuit = p5.Vector.sub(closest.position, this.position);
        pursuit.setMag(this.baseSpeed);
        this.velocity.lerp(pursuit, 0.2);
      }
    }
  }

  boostSpeed() {
    this.baseSpeed = this.boostedSpeed; // Increase the base speed
  }

  normalSpeed() {
    this.baseSpeed = 1.5; // Reset to normal speed
  }

  reproduce() {
    totalPredatorsBorn++; // Increment the total predators born counter
    predators.push(new Predator(this.position.x + random(-20, 20), this.position.y + random(-20, 20)));
  }

display() {
  if (this.justAte) {
    fill(255, 150, 0, this.lifespan);
  } else {
    fill(255, 0, 0, this.lifespan);
  }
  push();
  translate(this.position.x, this.position.y);
  rotate(this.velocity.heading());
  ellipse(0, 0, this.size * 1.7, this.size);
  pop();
}


  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }

  formPack(predators) {
    for (let other of predators) {
      let d = p5.Vector.dist(this.position, other.position);
      if (d < PACK_FORMATION_DISTANCE && this.pack.length < MAX_PACK_SIZE) {
        this.pack.push(other);
        other.isLeader = false;  // Only the initiator is the leader
      }
    }
    if (this.pack.length > 0) {
      this.isLeader = true;
    }
  }

  avoidBarriers() {
    for (let barrier of barriers) {
      let d = this.position.dist(barrier.position);
      if (d < BARRIER_AVOIDANCE_DISTANCE) {
        let diff = p5.Vector.sub(this.position, barrier.position);
        diff.normalize();
        diff.mult(BARRIER_AVOIDANCE_FORCE);
        this.velocity.add(diff);
      }
    }
  }
}




class Carcass {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.lifespan = 10 * 60; // 60 seconds at 60 fps
    this.decayRate = 0.1; // Rate at which the carcass decays visually
    this.size = 15; // Initial size
  }

  display() {
    // Decay effect: Carcass shrinks and fades over time
    let alpha = map(this.lifespan, 0, 60 * 60, 0, 255);
    let size = map(this.lifespan, 0, 60 * 60, 5, this.size);
    fill(139, 69, 19, alpha); // Dark brown color
    ellipse(this.position.x, this.position.y, size); // Draw carcass
  }

  update() {
    this.lifespan -= this.decayRate;
    return this.lifespan <= 0;
  }
}

class City {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.projectiles = [];
    this.fireRate = 120; // Time between bursts
    this.burstCount = 4; // Number of shots in a burst
    this.burstInterval = 5; // Interval between shots in a burst (in frames)
    this.protectiveRange = 200;
    this.shotCounter = 0; // Counter for shots fired in the current burst
    this.burstTimer = 0; // Timer to control firing within a burst
  }

  fireProjectile(target) {
    if (frameCount % this.fireRate === 0 || (this.shotCounter > 0 && this.burstTimer === 0)) {
      this.projectiles.push(new Projectile(this.position.x, this.position.y, target));
      this.shotCounter++;
      this.burstTimer = this.burstInterval;

      if (this.shotCounter >= this.burstCount) {
        this.shotCounter = 0; // Reset counter after the burst is omplete
      }
    }

    if (this.burstTimer > 0) {
      this.burstTimer--;
    }
  }
  dispensePrey() {
    // Logic to dispense prey periodically
    if (frameCount % 180 === 0) { // Dispenses prey every 3 seconds at 60 FPS
      prey.push(new Prey(this.position.x + random(-20, 20), this.position.y + random(-20, 20)));
    }
  }



  display() {
    // Display the city emoji
    textSize(48); // Size of the emoji
    textAlign(CENTER, CENTER); // Align the text to draw from the center
    text('🏟️', this.position.x, this.position.y); // Cityscape emoji

    // Display the protective range
    noFill();
    stroke(0); // Light blue for the protective range
    ellipse(this.position.x, this.position.y, this.protectiveRange * 2);

    // Display and update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let projectile = this.projectiles[i];
      projectile.move();
      projectile.display();

      // Check for hits
      for (let predator of predators) {
        if (projectile.hit(predator)) {
          // Remove predator and projectile on hit
          let index = predators.indexOf(predator);
          if (index > -1) {
            predators.splice(index, 1);
          }
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
}

class Projectile {
  constructor(x, y, target) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.sub(target.position, createVector(x, y));
    this.velocity.setMag(5); // Adjust speed as needed
    this.size = 5;
    this.trail = []; // Array to store past positions
    this.trailLength = 10; // Length of the trail
  }

  move() {
    this.position.add(this.velocity);

    // Store the current position in the trail
    this.trail.push(this.position.copy());
    if (this.trail.length > this.trailLength) {
      this.trail.shift(); // Remove the oldest position if trail is too long
    }
  }

  display() {
    // Draw the projectile
    fill(255, 0, 0); // Red for danger!
    ellipse(this.position.x, this.position.y, this.size);

    // Draw the trail
    for (let i = 0; i < this.trail.length; i++) {
      // Calculate the alpha to create a fade effect
      let alpha = map(i, 0, this.trail.length, 0, 255);
      fill(255, 0, 0, alpha);
      let pos = this.trail[i];
      ellipse(pos.x, pos.y, this.size * 0.5); // Smaller size for trail dots
    }
  }

  hit(target) {
    return this.position.dist(target.position) < this.size / 2 + target.size / 2;
  }
}



class Barrier {
  constructor(x, y, startTime) {
    this.position = createVector(x, y);
    this.startTime = startTime;
    // Apply a 60% reduction to the durations
    this.fullVisibleDuration = 30 * 60 * 0.4; // 40% of 30 seconds at 60 FPS
    this.fadeDuration = 10 * 60 * 0.4; // 40% of 10 seconds at 60 FPS
    this.totalDuration = this.fullVisibleDuration + this.fadeDuration;
  }

  display() {
    let elapsedTime = frameCount - this.startTime;
    let alpha = 255;

    // If within the fading time window, start fading
    if (elapsedTime > this.fullVisibleDuration) {
      alpha = map(elapsedTime, this.fullVisibleDuration, this.totalDuration, 255, 0);
      alpha = max(alpha, 0); // Ensure alpha doesn't go below 0
    }

    // Draw the barrier with the current alpha value
    push();
    textSize(24);
    textAlign(CENTER, CENTER);
    fill(255, 255, 255, alpha); // Apply the fade factor
    text('🪨', this.position.x, this.position.y); // Mountain emoji for the barrier
    pop();
  }

  update() {
    let elapsedTime = frameCount - this.startTime;

    // Check if the barrier's total duration has been surpassed
    if (elapsedTime >= this.totalDuration) {
      return true; // Barrier should be removed
    }
    return false; // Barrier stays
  }
}

class Mushroom {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.lifespan = 30 * 60; // 30 seconds at 60 fps
    this.lastSpawnTime = 0; // Track the last spawn time
    this.minSpawnInterval = 300; // Minimum interval between spawns (5 seconds at 60 fps)
  }

  update() {
    // Decrease lifespan every frame
    this.lifespan--;

    // Random chance to spawn a predator, or force spawn if it's been 5 seconds
    if (random() < 0.05 || frameCount - this.lastSpawnTime >= this.minSpawnInterval) {
      predators.push(new Predator(this.position.x + random(-20, 20), this.position.y + random(-20, 20)));
      this.lastSpawnTime = frameCount;
    }

    // Check if lifespan is over
    return this.lifespan <= 0; // This will return true when the lifespan is over
  }

  display() {
    // Only display if lifespan is greater than 0
    if (this.lifespan > 0) {
      push(); // Isolates the style changes
      textSize(32);
      textAlign(CENTER, CENTER);
      fill(255); // Set fill color to white
      stroke(0); // Set stroke color to black
      text('🍄', this.position.x, this.position.y);
      pop(); // Restores previous styles
    }
  }
}


class UFO {
  constructor() {
    this.position = createVector(random(width), random(height));
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector();
    this.maxSpeed = 2; // Maximum speed of the UFO
    this.maxForce = 0.05; // Maximum steering force
    this.wanderTheta = 0; // Wandering angle for steering
    this.size = 30; // Size of the UFO

    // Ray Gun Variables
    this.rayGunRange = 100; // Effective range of the ray gun
    this.rayGunEffect = 50; // Damage or effect of the ray gun
  }

  move() {
    // Wandering behavior for movement
    this.wander();
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Edge wrapping
    this.edges();

    // Ray Gun Logic
    for (let i = predators.length - 1; i >= 0; i--) {
      let predator = predators[i];
      let d = this.position.dist(predator.position);
      if (d < this.rayGunRange) {
        this.fireRayGun(predator);
      }
    }
  }

  wander() {
    let wanderRadius = 50;
    let wanderDistance = 60;
    let change = 0.1;

    this.wanderTheta += random(-change, change);

    let wanderPoint = this.velocity.copy();
    wanderPoint.setMag(wanderDistance);
    wanderPoint.add(this.position);

    let h = this.velocity.heading();
    let wanderX = wanderRadius * cos(this.wanderTheta + h);
    let wanderY = wanderRadius * sin(this.wanderTheta + h);
    wanderPoint.add(wanderX, wanderY);

    let steer = p5.Vector.sub(wanderPoint, this.position);
    steer.setMag(this.maxForce);
    this.applyForce(steer);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  edges() {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }

  fireRayGun(target) {
    if (typeof target.energy === 'number') {
      target.energy -= this.rayGunEffect;
      if (target.energy <= 0) {
        let index = predators.indexOf(target);
        if (index > -1) {
          predators.splice(index, 1);
        }
      }

      push();
      stroke(255, 0, 0); // Visual effect of the ray gun
      line(this.position.x, this.position.y, target.position.x, target.position.y);
      pop();
    }
  }

  display() {
    textSize(24);
    textAlign(CENTER, CENTER);
    text('🛸', this.position.x, this.position.y);
  }
}


function resetSimulation() {
  // Clear existing arrays
  prey = [];
  predators = [];
  carcasses = [];
  barriers = [];
  city = null;  // Changed from [] to null, as city seems to be a single object
  ufo = null;   // Changed from [] to null, for the same reason as above
  mushrooms = []; // Clear the mushroom array
  // Reinitialize prey and predators
  for (let i = 0; i < INITIAL_PREY_COUNT; i++) {
    prey.push(new Prey(random(width), random(height)));
  }
  for (let i = 0; i < INITIAL_PREDATOR_COUNT; i++) {
    predators.push(new Predator(random(width), random(height)));
  }

  // Reset the chart data
  chartData.labels = [];
  chartData.datasets.forEach((dataset) => {
    dataset.data = [];
  });
  populationChart.update();

  // Reset stats and control variables
  simulationRunning = true;
  winMessage = '';
  startTime = millis(); // Reset the start time
  endTime = undefined;
  countdown = 60;
  peakPrey = 0;
  peakPredators = 0;

  // Any other reset logic you might have
}

document.getElementById('resetButton').addEventListener('click', resetSimulation);