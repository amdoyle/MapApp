// Creates the gservice factory.
// This will be the primary means by which we interact with Google Maps
angular.module('gservice', [])
       .factory('gservice', function($rootScope, $http) {

        // Initialize Variables-------------------------------------------------
        /* googleMapService is an object and it will hold the refresh function
        that we will use to build/rebuild our map */
        var googleMapService = {};
        /* Array of locations obtained for API call. Below is a function to
        convert our collected lat/lng data to the Google format - which will be
        stored in this array */
        var locations = [];

        /* Selected Location (initialize to Toronto), this will hold the
        specific location we are looking at during any given point. */
        var selectedLat = 43.6532;
        var selectedLong = -79.3832;

        // This will handle clicks and location selection
        googleMapService.clickLat = 0;
        googleMapService.clickLong = 0;

        var lastMarker;
        var currentSelectedMarker;

        // FUNCTIONS============================================================

        /* Refresh the Map with new data. This function will take new latitude and
        longitude coordinates and will refresh the map with this info. Note: this
        function will be running as soon as the window loads*/
        googleMapService.refresh = function(latitude, longitude, filteredResults) {
          // Clears the holding array of locations
          locations = [];

          // Set the selected lat and long equal to the ones provided on the refresh() call
          selectedLat = parseFloat(latitude);
          selectedLong = parseFloat(longitude);
            // if filtered results are provided in the refresh call
            if(filteredResults) {
              // convert the filtered results into map points
              locations = convertToMapPoints(filteredResults);
              // then, initialize the map -- noting that a filter was used
              initialize(latitude, longitude, true);
              // if no filter is provided in the refrsh call
            } else {
              //Perform an AJAZ call to get all the records in the db
              $http.get('/users').success(function(response){
                // then convert the results into map points
                locations = convertToMapPoints(response);
                //then initialize the map -- noting that no filter was uesed.
                initialize(latitude, longitude, false);
              }).error(function(){});

            }
        };



          // PRIVATE INNER FUNCTIONS -------------------------------------------
          // Convert the locations holder
          var convertToMapPoints = function(response){
            // Clear the locations holder
            var locations = [];

            /* Loop through all of the JSON entries provided in the response
            and creates an array of Google formated coordinates with the pop-up
            message built in. */
            for(var i= 0; i < response.length; i++){
              var user = response[i];
              // create popup window for each record
              var contentString =
              '<p><b>Username</b>: ' + user.username +
              '<br /><b>Age</b>: ' + user.age +
              '<br /><b>Gender</b>: ' + user.gender +
              '<br /><b>Favourite Lanaguage</b>: ' + user.favlang +
              '</p>';
              /* Converts (and push into our locations array) each of the JSON
              reocrds into Google Maps Location formate Note: [Lat, Lng] format */
              locations.push({
                latlng: new google.maps.LatLng(user.location[1], user.location[0]),
                message: new google.maps.InfoWindow({
                  content: contentString,
                  maxWidth: 320,
                }),
                username: user.username,
                gender: user.gender,
                age: user.age,
                favlang: user.favlang,
              });
            }
            /* This returns locations, which is now an array populated with
            records in Google Maps format*/
            return locations;
          };

          // Initialize a generic google map (this will be called from the refresh function)
          var initialize = function(latitude, longitude, filter) {

            // Uses the selected lat, long as starting point
            var myLatLng = {lat: selectedLat, lng: selectedLong};

            // If map has not been created already..
            if(!map){
              // This creates a new map and places it in the index.html
              var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 3,
                center: myLatLng,
              });
            }

            // if there is a filter then use the yellow market if not use the blue
            if(filter){
              icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
            } else {
              icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
            }


            // Loop through each location in the array and place a maker on our map
            locations.forEach(function(n, i){

              var marker = new google.maps.Marker({
                position: n.latlng,
                map: map,
                title: 'Big Map',
                icon: icon
              });

              // For each maker created, add an event listener that checks for click events
              google.maps.event.addListener(marker, 'click', function(e){
                // When the marker is cliekc, it will open the slected marker's message
                currentSelectedMarker = n;
                n.message.open(map, marker);
              });
            });

            // Set initial location as a bouncing red marker
            var initialLocation = new google.maps.LatLng(latitude, longitude);

            var redMarker = new google.maps.Marker({
              position: initialLocation,
              animation: google.maps.Animation.BOUNCE,
              map: map,
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            lastMarker = redMarker;


          // Function for moving the map to the selected location
          map.panTo(new google.maps.LatLng(latitude, longitude));

          // Function to move the map when user clicks - this will move the red bouncing marker
          google.maps.event.addListener(map, 'click', function(e){

            var redMarker = new google.maps.Marker({
              position: e.latLng,
              animation: google.maps.Animation.BOUNCE,
              map: map,
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            //  When a new location is slected the old red marker is removed
            if(lastMarker){
              lastMarker.setMap(null);
            }
            // Create a new red bound marker and moves to the new location
            lastMarker = redMarker;
            map.panTo(lastMarker.position);

            // Update th broadcasted vars so the form will be updated
            googleMapService.clickLat = redMarker.getPosition().lat();
            googleMapService.clickLong = redMarker.getPosition().lng();
            $rootScope.$broadcast("clicked");
          });
        };
          // Refresh the page upon window load and calls the refresh function (defined above)
          // Use the initial latitude and longitude
          google.maps.event.addDomListener(window, 'load',
            googleMapService.refresh(selectedLat, selectedLong));
          return googleMapService;
        });
