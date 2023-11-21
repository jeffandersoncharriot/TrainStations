let button = document.getElementById('submit')
let pathURL = 'http://10.101.0.12:8080/path/'
let output = document.getElementById('info')


let distanceURL = 'http://10.101.0.12:8080/distance/'
let scheduleURL = 'http://10.101.0.12:8080/schedule/'
let avgTrainSpeedURL = 'http://10.101.0.12:8080/averageTrainSpeed'
let stationsURL = 'http://10.101.0.12:8080/stations'
let stationIdDetailsURL = 'http://10.101.0.12:8080/stations'


let stationsFrom = document.getElementsByTagName('label')
let stationsTo = document.getElementsByTagName('label2')
let tripDetailsArray = []

let currentSegment = 0
let time = document.getElementById('timeInput')
let avgTrainSpeed
let userInputFrom = document.getElementsByClassName('inputFrom')
let userInputTo = document.getElementsByClassName('inputTo')

let initialSegmentsTime
let totalTripSegment = 0

let outputDetails = document.getElementById("outputDetails")
let tripPath = document.getElementById("tripPath")

const MIN = 0
const maxMinutes = 60;
const maxHours = 24
const hoursIndex = 0
const minutesIndex = 1
const resetHours = 0
const hoursToSeconds = 3600
const doubleDigitsForTime = 10


function timeConverter(input) {

    let result = (input < doubleDigitsForTime) ? `0${input}` : `${input}`

    return result

}


async function allStations() {


    const response = await fetch(stationsURL)

    let stations = await response.json()


    for (let i = 0; i < stations.length; i++) {


        stationsFrom[i].innerHTML += stations[i].Name

        userInputFrom[i].value = stations[i].Name

        stationsTo[i].innerHTML += stations[i].Name

        userInputTo[i].value = stations[i].Name


    }



}

allStations()


const findClosest = (alltimesSchedule, timeInput) => {

    let index = 0

    let closestSchedule = alltimesSchedule[MIN];


    for (let i = 0; i < alltimesSchedule.length; i++) {
        if (Math.abs(alltimesSchedule[i] - timeInput) < Math.abs(closestSchedule - timeInput)) {
            closestSchedule = alltimesSchedule[i]
            index = i
        }
    }

    if (closestSchedule < timeInput) {
        if (index == alltimesSchedule.length - 1) {
            return alltimesSchedule[firstSchedule]
        }

        return alltimesSchedule[index + 1]
    }

    return alltimesSchedule[index]

}



async function stationRecommendedSchedule(station, idSegment, value) {

    scheduleURL = `http://10.101.0.12:8080/schedule/${station}`

    const res = await fetch(scheduleURL)

    let schedule = await res.json()


    let stationSchedules = []
    let closest = 0

    for (let i = 0; i < schedule.length; i++) {

        let date = new Date(schedule[i].Time)

        if (schedule[i].SegmentId == idSegment) {
            stationSchedules.push((date.getUTCHours() * maxMinutes + date.getUTCMinutes()))
        }
    }

    let hoursAndMinutes = value.split(":")

    let minutesFull = (Number(hoursAndMinutes[hoursIndex]) * maxMinutes) + Number(hoursAndMinutes[minutesIndex])

    closest = findClosest(stationSchedules, minutesFull)

    let hours = Math.floor(closest / maxMinutes)

    let minutes = Math.floor(closest % maxMinutes)



    output.innerText += `Station TO TAKE: ${station} - Closest Time Schedule: ${timeConverter(hours)}:${timeConverter(minutes)} \n\n`


    let timeInArray = [hours, minutes]

    return timeInArray

}






async function getTrainSpeed() {
    const res = await fetch(avgTrainSpeedURL)

    let speed = await res.json()

    avgTrainSpeed = speed[MIN].AverageSpeed
}


button.addEventListener('click', remTrip)


async function remTrip() {

    getTrainSpeed()

    let valueFromChecked
    let valueToChecked

    let pathFromNotChecked = Array.from(userInputFrom).every(start => {
        if (start.checked) {
            valueFromChecked = start.value
            return false
        }

        return true
    })


    let pathToNotChecked = Array.from(userInputTo).every(destination => {
        if (destination.checked) {
            valueToChecked = destination.value
            return false
        }

        return true
    })


    if (pathFromNotChecked === true || pathToNotChecked === true) {
        alert("Please select the start and destination")
    }
    else if (time.value == "") {
        alert("Please add the time you want to start the trip")
    }
    else if (valueFromChecked === valueToChecked) {
        alert("Please choose different stations for start and destination")
    }
    else {

        removeCreatedButtons()
        
        output.innerText = ""

        outputDetails.innerText = "TRIP DETAILS"

        tripPath.innerText = "TRIP PATH"

        pathURL = `http://10.101.0.12:8080/path/${valueFromChecked}/${valueToChecked}`

        const response = await fetch(pathURL)

        let path = await response.json()

        initialSegmentsTime = await stationRecommendedSchedule(path[MIN].Name, path[MIN].SegmentId, time.value)

        currentSegment = path[MIN].SegmentId

        for (var i = 0; i < path.length - 1; i++) {


            distanceURL = `http://10.101.0.12:8080/distance/${path[i].Name}/${path[i + 1].Name}`

            const response2 = await fetch(distanceURL)

            let data = await response2.json()

            let totalSeconds = (data / avgTrainSpeed) * hoursToSeconds

            totalTripSegment += Math.floor(totalSeconds)

            let minutes = Math.floor(totalSeconds / maxMinutes)

            let seconds = Math.floor(totalSeconds % maxMinutes)

            let btn = document.createElement("button");

            btn.innerHTML = path[i].Name;

            btn.value = path[i].StationId

            document.body.appendChild(btn);

            tripDetailsArray.push(btn)


            if (currentSegment == path[i + 1].SegmentId) {



                output.innerText += `From ${path[i].Name} To ${path[i + 1].Name}\n`

                output.innerText += `Distance = ${data} km - Time to reach this path destination = ${timeConverter(minutes)}:${timeConverter(seconds)} minutes \n`

                convertMinutesToTime()

                output.innerText += `Estimated arrival time: ${timeConverter(initialSegmentsTime[hoursIndex])}:${timeConverter(initialSegmentsTime[minutesIndex])}\n\n`

                currentSegment = path[i + 1].SegmentId

            }
            else {

                convertMinutesToTime()

                currentSegment = path[i + 1].SegmentId

                initialSegmentsTime = await stationRecommendedSchedule(path[i + 1].Name, path[i + 1].SegmentId, `${initialSegmentsTime[0]}:${initialSegmentsTime[1]}`)

                totalTripSegment = 0

            }



        }

        btn = document.createElement("button")

        btn.innerHTML = path[path.length - 1].Name;

        btn.value = path[path.length - 1].StationId

        document.body.appendChild(btn);


        tripDetailsArray.push(btn)


        convertMinutesToTime()

        output.innerText += `Estimated arrival time: ${timeConverter(initialSegmentsTime[hoursIndex])}:${timeConverter(initialSegmentsTime[minutesIndex])}\n`



        Array.from(tripDetailsArray).forEach(station => {

            station.addEventListener("click", () => { tripDetails(station) })
        });



    }
}

function removeCreatedButtons() {
    Array.from(tripDetailsArray).forEach(station => {

        station.remove()
    });
}

function convertMinutesToTime() {
    while (totalTripSegment >= maxMinutes) {
        initialSegmentsTime[minutesIndex]++
        totalTripSegment -= maxMinutes
    }

    while (initialSegmentsTime[minutesIndex] >= maxMinutes) {
        initialSegmentsTime[hoursIndex]++
        initialSegmentsTime[minutesIndex] -= maxMinutes
    }

    if (initialSegmentsTime[hoursIndex] == maxHours) {
        initialSegmentsTime[hoursIndex] = resetHours
    }
}


async function tripDetails(stationDetails) {
    stationDetailsURL = `http://10.101.0.12:8080/stations/${stationDetails.value}`

    const res = await fetch(stationDetailsURL)

    let stationDetailsData = await res.json()

    alert(`${stationDetailsData[MIN].Name} - Street ${stationDetailsData[MIN].StreetName} - Postal Code: ${stationDetailsData[MIN].PostalCode}\n`)

}