

/**
 * Some global variables to hold state and initial configuration
 */
let gridState;
let decayTrail; // decayTrail increment, will never be more than maxDecayTrail
let totalGen; // Total count of iterations
let interval = null;
let sizeX = 100;
let sizeY = 100;
let maxDecayTrail = 3;
const container = document.getElementById('container');

/**
 * Set initial value of X/Y input and trail on the screen
 */
document.getElementById('sizeX').value = sizeX;
document.getElementById('sizeY').value = sizeY;
document.getElementById('trail').value = maxDecayTrail;

/**
 * On initial page load, initialise state and render table.
 */
init();
render();


/**
 * Initialise grid for gen-zero based on specified grid size.
 */
function init()
{
    decayTrail = 0;
    totalGen = 0;
    interval = null;
    gridState = new Array(sizeY).fill(0).map(x => new Array(sizeX).fill(0));
    message('Click on the cells to seed a start pattern. <button onclick="random()">Random?</button>');
}

/**
 * Render
 *
 * Completely new render of the table, called on initialise or on grid size change.
 * Resets display messages.
 */
function render()
{
    try {
        container.removeChild(container.getElementsByTagName('table')[0]);
    } catch (e) {
        // Ignore if doesn't exist
    }
    const table = document.createElement('table');
    let x = 0, y = 0;
    for (const row of gridState) {
        const rowNode = document.createElement('tr');
        for (const cell of row) {
            const cellNode = document.createElement('td');
            cellNode.setAttribute('x', x);
            cellNode.setAttribute('y', y);
            cellNode.addEventListener('click', toggleCellState);
            if (cell) {
                cellNode.classList.add('alive');
                cellNode.classList.add('decay-'+decayTrail);
            }
            rowNode.append(cellNode);
            y++;
        }
        table.append(rowNode);
        y = 0;
        x++;
    }
    container.append(table);
}

/**
 * Re-Draw
 *
 * Update the display classes on the table based on new state.
 * Class is set to "alive" if cell is alive, plus sets a decay class used to highlight recently
 * alive cells, if it should die.
 * @param {boolean} [reset] - Complete reset of generations, clear decay, don't update message.
 */
function reDraw(reset)
{
    if (!reset) {
        message('Generation: ' + totalGen);
    }
    let x = 0, y = 0;
    for (const rowNode of container.getElementsByTagName('table')[0].getElementsByTagName('tr')) {
        for (const cellNode of rowNode.getElementsByTagName('td')) {
            if (reset) {
                cellNode.className = '';
            } else {
                cellNode.classList.remove('decay-'+decayTrail);
            }
            if (gridState[x][y]) {
                cellNode.classList.add('alive');
                cellNode.classList.add('decay-'+decayTrail);
            } else {
                cellNode.classList.remove('alive');
            }
            y++;
        }
        y = 0;
        x++;
    }
}

/**
 * Set Starting Population
 *
 * Sets n number of alive cells, randomly placed on the grid.
 * @param {int} n 
 */
function setStartingPopulation(n)
{
    for (let i = 0; i < n; i++) {
        const x = Math.floor(Math.random() * gridState.length);
        const y = Math.floor(Math.random() * gridState[0].length);
        gridState[x][y] = 1;
        
    }
}

/**
 * Next Gen
 *
 * Iterates the state to the next generation.
 */
function nextGen()
{
    const nextGenGrid = JSON.parse(JSON.stringify(gridState)); // Copy previous state values
    let x = 0, y = 0;
    // Loop through each row / cell
    for (const row of nextGenGrid) {
        for (const cellActive of row) {
            // Get an array of cell neighbour states
            const neighbours = getNeighbours(x, y);
            // Calculate the number of alive neighbours
            const numAliveNeighbours = neighbours.reduce((a, b) => a + b, 0);
            // Use the Game of Life logic to determine if the cell should be alive in the next gen
            if ((cellActive && numAliveNeighbours > 1 && numAliveNeighbours < 4)
                || (!cellActive && numAliveNeighbours === 3)
            ) {
                nextGenGrid[x][y] = 1;
            } else {
                nextGenGrid[x][y] = 0;
            }
            y++;
        }
        y = 0;
        x++;
    }
    // Check to see if the state has changed, if it hasn't then the play loop can stop
    if (JSON.stringify(nextGenGrid) === JSON.stringify(gridState)) {
        stop();
        message('Generation: ' + totalGen + '. Life is complete :)');
    } else {
        // If it has changed, increment and append the next generation
        decayTrail = (decayTrail + 1) % (maxDecayTrail + 1); // Only flag decay history of "maxGen" generations
        totalGen++; // Keep track of current number of iterations
        gridState = nextGenGrid;
        // Then redraw the HTML grid
        reDraw();
    }
}

/**
 * Get Neighbours
 *
 * Returns the neighbours of x/y cell in their current state.
 * If the neighbour is off the edge of the grid, wrap to the opposite side.
 */
function getNeighbours(x, y) {
    let ltx = x - 1 < 0 ? gridState.length - 1 : x - 1;
    let gtx = x + 1 >= gridState.length ? 0 : x + 1;
    let lty = y - 1 < 0 ? gridState[x].length - 1 : y - 1;
    let gty = y + 1 >= gridState[x].length ? 0 : y + 1;
    return [
        gridState[ltx][lty],
        gridState[ltx][y],
        gridState[ltx][gty],
        gridState[x][lty],
        gridState[x][gty],
        gridState[gtx][lty],
        gridState[gtx][y],
        gridState[gtx][gty],
    ];
}

/**
 * Error / Message methods to display notice to the user where required.
 */

function error(message) {
    document.getElementById('message').innerHTML = '<span class="error">'+message+'</span>';
}

function message(message) {
    document.getElementById('message').innerHTML = message;
}


/**
 * Control methods called from the UI onlick
 */

/**
 * Toggle Cell State - Click on a cell to set up initial seed pattern.
 * @param event
 */
function toggleCellState(event) {
    if (interval) {
        // Is running, can't change anything, just ignore click
        return;
    }
    const x = event.target.getAttribute('x');
    const y = event.target.getAttribute('y');
    gridState[x][y] = !gridState[x][y];
    reDraw(true);
}

 /**
  * Start - Automatically increment the generation every 100ms
  */
function start() {
    stop();
    nextGen();
    interval = setInterval(nextGen, 100);
}

/**
 * Stop - Stop automatic iterations
 */
function stop() {
    if (interval) {
        clearInterval(interval);
    }
}

/**
 * Next - Manually increment to the next generation
 */
function next() {
    stop();
    nextGen();
}

/**
 * Reset - Stop any animation and clear the grid
 */
function reset() {
    stop();
    init();
    reDraw(true);
}

/**
 * Set Size - Allows the user to alter the size of the grid.
 */
function setSize() {
    // Validate that new sizeX/Y are reasonable, before updating the grid.
    const newSizeX = Math.round(parseFloat(document.getElementById('sizeX').value));
    const newSizeY = Math.round(parseFloat(document.getElementById('sizeY').value));
    if (isNaN(newSizeX) || isNaN(newSizeY) || newSizeX < 5 || newSizeY < 5 || newSizeX > 200 || newSizeY > 200) {
        error('Invalid size (allowed 5 - 200)');
        document.getElementById('sizeX').value = sizeX;
        document.getElementById('sizeY').value = sizeY;
        return;
    }
    sizeX = newSizeX;
    sizeY = newSizeY;
    stop();
    init();
    render();
}

/**
 * Set Trail - Change the number of generations that the trail retains
 */
function setTrail() {
    stop();
    maxDecayTrail = parseInt(document.getElementById('trail').value);
    init();
    reDraw(true);
}

/**
 * Random - Generate random seed
 */
function random() {
    init();
    setStartingPopulation(Math.ceil((sizeX * sizeY) / 5));
    reDraw(true);
}