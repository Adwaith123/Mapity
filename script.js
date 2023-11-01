'use strict';

//////////////////---------Code Start Here------///////////////////

////////////////////------------Defining Classes---///////////////

class Workout {
  date = new Date(); // modern classfields
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

//----Child Classes

class Running extends Workout {
  type = 'running';
  constructor(coords, distanace, duration, cadence) {
    super(coords, distanace, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); // throgh scope chain this will be accesses
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'; // Always equal to this.type = 'cycling';
  constructor(coords, distanace, duration, elevationGain) {
    super(coords, distanace, duration);
    this.elevationGain = elevationGain;
    this.speed = this.calcSpeed();
    this._setDescription(); // throgh scope chain this will be accesses
  }

  calcSpeed() {
    //min/km
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////------------Application Archetecture---------------//////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 12;
  #workouts = [];
  constructor() {
    //Get users position
    this._getPosition(); // this keyword refers to current object

    //get data from local storage

    this._getLocalStorage();

    //Attach event Handlers
    //-----Event Listners-------------+
    form.addEventListener('submit', this._newWorkout.bind(this)); // Here this keyword refers to form elemnt it attached to the app object

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      // get current function call the callback function loadMap
      // and here this._loadMap is considered as regular function call
      // and the this keyword inside loadmap points to undefined and now this points to current object that is loadmap
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //------>Important loadMap iscallback
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    ///////////------------Leaft-let oveview COde-----------------
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    //////////////////////////////////////////////////////////

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling click on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work); //  render marker only after map loading
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; // Coppying it to a global Varibale
    form.classList.remove('hidden');
    inputDistance.focus(); // Cursor start blinking on km
  }

  _hideForm() {
    //Empty Inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ' ';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(e) {
    e.preventDefault();
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    //Helper Function
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //////////////////Get data from the form////////////////

    const type = inputType.value; // Option property of html
    const distance = +inputDistance.value; // normally the output is string
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; // destructuring to [lat,lng]
    let workout;

    //if workout is running, create running Object

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence) //Inverting the validation modern , // Guard Clause
      )
        return alert('Input Have to be PositiveNumber');

      //Creating new object based on Running
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout is cycling , create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input Have to be PositiveNumber');

      //Creating new object based on Running
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    console.log(workout);
    // Add new object to workouts array
    this.#workouts.push(workout);
    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    // Render workout on list
    this._renderWorkout(workout);

    //Hide form + Clear input Fields

    this._hideForm();

    // Set Local Storage to all Workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    ////////////////////Display Marker///////////////////////

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `
    <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        </li>`;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout'); // endup at li
    // console.log(workoutEl);

    if (!workoutEl) return; // guard clause

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pann: {
        duration: 1,
      },
    });

    // using the public interface

    //workout.click();
  }
  _setLocalStorage() {
    // A API that browser provides
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// console.log(app);
