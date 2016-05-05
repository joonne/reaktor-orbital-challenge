// Reaktor Orbital Challenge
// (c) Jonne Pihlanen 2016

const
    fsp = require('fs-promise'),
    csv = require('csv');

fsp.readFile('./data2.csv')
    .then((contents) => {
        csv.parse(contents, (err, data) => {

            let seed = data.shift()[0];
            console.log(seed);
            let route = data.pop();
            let start = {
                latitude: parseFloat(route[1]),
                longitude: parseFloat(route[2]),
                altitude: 0
            };

            let end = {
                latitude: parseFloat(route[3]),
                longitude: parseFloat(route[4]),
                altitude: 0
            };

            data = data.map((item) => {
                return {
                    id: item[0],
                    latitude: parseFloat(item[1]),
                    longitude: parseFloat(item[2]),
                    altitude: parseFloat(item[3])
                };
            });

            let horizonA = distanceToHorizon(start);
            let startPointSatellites = [];
            data.forEach((item) => {
                let distance = calculateDistance(calculateCoordinate(start), calculateCoordinate(item));
                let horizonB = distanceToHorizon(item);
                if (distance <= horizonA + horizonB) {
                    // console.log("start position can see satellite " + item.id);
                    startPointSatellites.push(item);
                }
            });

            horizonA = distanceToHorizon(end);
            let endPointSatellites = [];
            data.forEach((item) => {
                distance = calculateDistance(calculateCoordinate(end), calculateCoordinate(item));
                horizonB = distanceToHorizon(item);
                if (distance <= horizonA + horizonB) {
                    // console.log("end position can see satellite " + item.id);
                    endPointSatellites.push(item);
                }
            });

            startPointSatellites.forEach((item) => {
                console.log("finding routes for " + item.id);
                findRoute(item, endPointSatellites, data, [], [item]);
            });

        });
    });

// algorithm to find the route
const findRoute = (itemA, endPointSatellites, allSatellites, nextSatellites, route) => {

    // console.log("processing satellite " + itemA.id);
    if(endPointSatellites.indexOf(itemA) > -1) {
        console.log(route.map(item => item.id).toString());
        return route.push(itemA);
    }

    let horizonA = distanceToHorizon(itemA);
    allSatellites.forEach((itemB) => {
        let distance = calculateDistance(calculateCoordinate(itemA), calculateCoordinate(itemB));
        let horizonB = distanceToHorizon(itemB);
        if (distance <= horizonA + horizonB && itemA.id != itemB.id && route.indexOf(itemB) === -1) {
            // console.log("satellite " + itemA.id + " can see satellite " + itemB.id);
            route.push(itemB);
            return findRoute(itemB, endPointSatellites, allSatellites, [], route);
        }
    });
}

// the earth was considered to be a round sphere
// http://stackoverflow.com/questions/8981943/lat-long-to-x-y-z-position-in-js-not-working
const calculateCoordinate = (item) => {
    let cosLat = Math.cos(item.latitude * Math.PI / 180.0);
    let sinLat = Math.sin(item.latitude * Math.PI / 180.0);
    let cosLon = Math.cos(item.longitude * Math.PI / 180.0);
    let sinLon = Math.sin(item.longitude * Math.PI / 180.0);
    let rad = 6371000;
    return {
        x: rad * cosLat * cosLon,
        y: rad * cosLat * sinLon,
        z: rad * sinLat
    };
}

// distance between two XYZ points
const calculateDistance = (itemA, itemB) => {
    return Math.sqrt((itemB.x - itemA.x)*(itemB.x - itemA.x) + (itemB.y - itemA.y)*(itemB.y - itemA.y) + (itemB.z - itemA.z)*(itemB.z - itemA.z));
}

// https://en.wikipedia.org/wiki/Horizon#Exact_formula_for_a_spherical_Earth
const distanceToHorizon = (item) => {
    let rad = 6378.137;
    return Math.sqrt((2*rad*item.altitude) + item.altitude*item.altitude) * 1000;
}
