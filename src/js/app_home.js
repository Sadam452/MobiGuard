App = {
    web3Provider: null,
    contracts: {},
  
    init: async function() {  
      return await App.initWeb3();
    },
  
    initWeb3: async function() {
      // Initialize web3 provider
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("Web3 enabled by user");
        } catch (error) {
          console.error("User denied account access:", error);
        }
      } else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
      } else {
        console.error("No web3 provider detected, falling back to localhost");
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      web3 = new Web3(App.web3Provider);
  
      return App.initContract();
    },
  
    initContract: function() {
      // Load Adoption contract artifact
      $.getJSON('MobileDevice.json', function(data) {
          // Initialize contract with the loaded artifact
          var MobileDeviceArtifact = data;
          App.contracts.MobileDevice = TruffleContract(MobileDeviceArtifact);
          App.contracts.MobileDevice.setProvider(App.web3Provider);
          //check if any device is already sold or lost
          // console.error('Contract loaded. Marking adopted devices...');
          App.initListDevices();
      }).fail(function() {
          console.error("Failed to load contract");
      });
  
      // Bind events
      //set localStorage.getItem('username') to div with id=username
      document.getElementById('username').innerHTML += localStorage.getItem('username');
      return App.bindEvents();
    },
  
    bindEvents: function() {
      // Bind event handler for purchase button
    //   $(document).on('click', '.btn-purchase', App.handlePurchase);
    $(document).on('click', '.btn-report', App.handleReportLoss);
    $(document).on('click', '.btn-transfer', App.handleTransferOwnership);
    $(document).on('click', '.btn-fetch', App.handleFetch);
    },
  
    initListDevices: function() {
      // event.preventDefault();
      var adoptionInstance;
      //get deviceCount from smart contract
      App.contracts.MobileDevice.deployed().then(function(instance) {
        adoptionInstance = instance;
        console.log("Called getDeviceCount");
        return adoptionInstance.device_Count();
      }).then(function(result) {
        console.log("Device Count:", result.toString());
        var deviceCount = parseInt(result.toString());
        // if(deviceCount != 0){
        //   // console.log("No devices found");
        //   document.getElementById('show-alert').style.display = 'none';
        // }
        for(let i = 0; i < deviceCount; i++) {
          App.listDevices(i);
        }
      }).catch(function(err) {
        // alert("Error getting device count. Please try again.");
        console.error("Error getting device count:", err.message);
      });
    },
    listDevices: function(i) {
      App.contracts.MobileDevice.deployed().then(function(instance) {
        adoptionInstance = instance;
        console.log("called get devices");
        return adoptionInstance.getRHomeDevice(i);
      }).then(function(data) {
        console.log("Result: "+data[0]);
        var petsRow = $('#homeRow');
        var petTemplate = $('#homeTemplate');
        petTemplate.find('.panel-title').text(data[0]);
        petTemplate.find('img').attr('src', data[3]);
        petTemplate.find('.btn-report').attr('data-id', i);
        petTemplate.find('.btn-purchase').attr('data-id', i);
        petTemplate.find('.btn-transfer').attr('data-id', i);
        petTemplate.find('.btn-fetch').attr('data-id', i);
        if(data[4] === true){
        petTemplate.find('.status').text("Lost");
        //hide purchase button and show report button in disabled state   
        petTemplate.find('.btn-report').hide();
        petTemplate.find('.btn-purchase').hide();
        petTemplate.find('.btn-dummy').show();
        petTemplate.find('.btn-transfer').hide();
        petTemplate.find('.btn-fetch').show();

        // petTemplate.find('button').text('Report Theft').attr('disabled', true);
        }else{
          petTemplate.find('.status').text("Sold");
          petTemplate.find('.btn-report').show();
          petTemplate.find('.btn-purchase').hide();
          petTemplate.find('.btn-transfer').show();
          petTemplate.find('.btn-dummy').hide();
          petTemplate.find('.btn-fetch').hide();
        }
        petTemplate.find('.imei').text(data[1]);
        petTemplate.find('.location').text(data[2]);
        //if data[6] = localStorage.getItem('username') then append
        if(data[5] === localStorage.getItem('username')){
        petsRow.append(petTemplate.html());
        document.getElementById('show-alert').style.display = 'none';
        }
      }).catch(function(err) {
          alert("Error getting devices. Please try again.");
          console.error("Error getting devices ", err.message);
      });
    },
  
    handleReportLoss: function(event) {
      event.preventDefault();
      //if localStorage is empty redirect to login page
      if(localStorage.getItem('username') === null){
        window.location = 'login.html';
      }
  
      var deviceId = parseInt($(event.target).data('id'));
  
      var adoptionInstance;
      web3.eth.getAccounts(function(error, accounts) {
          if (error) {
              console.error(error);
          }
  
          var account = accounts[0];
  
          App.contracts.MobileDevice.deployed().then(function(instance) {
              adoptionInstance = instance;
              // Mark the device as lost
              return adoptionInstance.markLost(deviceId,localStorage.getItem('username'), { from: account });
          }).then(function(result) {
              console.log("Device marked as lost:", result);
              // Update UI to mark the device as lost
              // $(event.target).text('Lost').attr('disabled', true);
              $(event.target).closest('.panel-pet').find('.status').text('Lost');
              //$(event.target).closest('.panel-pet').find('.btn-report').hide();
              $(event.target).closest('.panel-pet').find('button').text('Report Theft').attr('disabled', true);
              $(event.target).closest('.panel-pet').find('.btn-purchase').hide();
              $(event.target).closest('.panel-pet').find('.btn-transfer').hide();
              $(event.target).closest('.panel-pet').find('.btn-fetch').show();
          }).catch(function(err) {
              console.error("Error marking device as lost:", err.message);
          });
      });
    },

    handleTransferOwnership: function(event) {
        event.preventDefault();

        var deviceId = parseInt($(event.target).data('id'));

        // Prompt the user to enter receiver's email and hash address
        var receiverEmail = prompt("Enter receiver's email:", deviceId);
        var receiverHashAddress = prompt("Enter receiver's hash address:");

        // Check if both inputs are provided
        if (receiverEmail && receiverHashAddress) {
            // Call the function to transfer ownership with the provided inputs
            if(localStorage.getItem('username') === null){
                window.location = 'login.html';
              }
              var adoptionInstance;
              web3.eth.getAccounts(function(error, accounts) {
                  if (error) {
                      console.error(error);
                  }
          
                  var account = accounts[0];
                  console.log("Account: "+account);
          
                  App.contracts.MobileDevice.deployed().then(function(instance) {
                      adoptionInstance = instance;
                      return adoptionInstance.transferOwnership(deviceId, receiverHashAddress, receiverEmail, { from: account });
                  }).then(function(result) {
                      console.log("Device ownership transferred successfully", result);
                        // Update UI to show the device as transferred
                        $(event.target).closest('.panel-pet').find('.btn-transfer').hide();
                        $(event.target).closest('.panel-pet').find('.btn-report').hide();
                  }).catch(function(err) {
                      console.error("Error transferring the ownership:", err.message);
                  });
              });
        } else {
            // If user cancels or leaves inputs blank, show error message
            alert("Please enter both receiver's email and hash address.");
        }
    },

    // handleFetch: function(event) {
    //   event.preventDefault();
    //   //if localStorage is empty redirect to login page
    //   if(localStorage.getItem('username') === null){
    //     window.location = 'login.html';
    //   }
    //   //get device id
    //   var deviceId = parseInt($(event.target).data('id'));
    //   //get imei value which has class 'imei'
    //   var imei = $(event.target).closest('.panel-pet').find('.imei').text();
    //   // make post api call to https://api.closeguardtechnology.com/v1/396slbHG7506Rlglhglbfj7/devicelist
    //   //with headers: Api-Token: 3853925hxnsvdebdyh36s and Request-Id: 123456789 and content-type: application/x-www-form-urlencoded
      
    // }
    handleFetch: function(event) {
      event.preventDefault();
      //if localStorage is empty redirect to login page
      if(localStorage.getItem('username') === null){
        window.location = 'login.html';
      }
      //get imei and devive id
      var adoptionInstance;
      web3.eth.getAccounts(function(error, accounts) {
          if (error) {
              console.error(error);
          }
  
          var account = accounts[0];
  
          App.contracts.MobileDevice.deployed().then(function(instance) {
              adoptionInstance = instance;
              // Mark the device as lost
              return adoptionInstance.returnLocation(localStorage.getItem('username'), { from: account });
          }).then(function(result) {
              // alert("Device location retreived:", result[0]);
              //getDocument by class .loc and set value of lat to result[0] and lon to result[1]
              //display .loc to block
              console.log("Device location retreived:", result[0], result[1]);
              //getDocument by class .loc and set value of lat to result[0] and lon to result[1]
              //display .loc to block
              document.getElementById('lat').innerHTML = "Latitude = "+ result[0];
              document.getElementById('lon').innerHTML = "Longitude = "+result[1];
              //display block
              document.getElementById('loc').style.display = 'block';
              var url = "https://www.google.com/maps/@"+result[0]+","+result[1]+",15z";
              document.getElementById('map').href = url;

          }).catch(function(err) {
              console.error("Error retreiving location", err.message);
          });
      });

    },
    // updateLocationPeriodically: async function() {
    //   console.log("Called location update");
    //   if (localStorage.getItem('username')) {
    //     try {
    //       const position = await navigator.geolocation.getCurrentPosition(
    //         (position) => {
    //           // Process the retrieved location data
    //           const latitude = position.coords.latitude;
    //           const longitude = position.coords.longitude;
    //           console.log("Latitude:", latitude, "Longitude:", longitude);
  
    //           //save the location info in blockchain
    //           var adoptionInstance;
    //           web3.eth.getAccounts(function(error, accounts) {
    //               if (error) {
    //                   console.error(error);
    //               }
          
    //               var account = accounts[0];
          
    //               App.contracts.MobileDevice.deployed().then(function(instance) {
    //                   adoptionInstance = instance;
    //                   // Mark the device as lost
    //                   return adoptionInstance.updateLocation(localStorage.getItem('username'), latitude, longitude, { from: account });
    //               }).then(function(result) {
    //                   console.log("Device location updated:", result);
    //               }).catch(function(err) {
    //                   console.error("Error updating location", err.message);
    //               });
    //           });
    //         },
    //         // Handle errors gracefully
    //         (error) => {
    //           console.error("Error getting location:", error);
    //           // Inform the user about the error or try alternative methods
    //         },
    //         {
    //           enableHighAccuracy: true, // Optional for more accurate location
    //           maximumAge: 5000,        // Optional to use cached location if available
    //           timeout: 5000            // Optional to give up after a timeout
    //         }
    //       );
    //     } catch (error) {
    //       console.error("Error:", error);
    //       // Handle any additional errors here
    //     }
    //   }
    // },
    updateLocationPeriodically: async function() {
      console.log("Called location update");
      if (localStorage.getItem('username')) {
        try {
          const position = await navigator.geolocation.getCurrentPosition(
            (position) => {
              // Process the retrieved location data
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;
              console.log("Latitude:", latitude, "Longitude:", longitude);
    
              // Immediately save the location to the blockchain within this callback
              App.updateLocation(latitude, longitude); // Call the blockchain update function here
            },
            // ... error handling and options ...
          );
        } catch (error) {
          console.error("Error:", error);
          // Handle errors
        }
      }
    },
    
    // Separate function for blockchain interaction
    updateLocation: function(latitude, longitude) {
      // Code to save location on the blockchain
      // ... using latitude and longitude
      console.log("Saving location to blockchain:", latitude, longitude);
    
      var adoptionInstance;
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.error(error);
        }
    
        var account = accounts[0];
    
        App.contracts.MobileDevice.deployed().then(function(instance) {
          adoptionInstance = instance;
          console.log("confirmaing",latitude, longitude);
          var lat = latitude.toString();
          var lon = longitude.toString();
          return adoptionInstance.updateLocation(localStorage.getItem('username'), lat, lon, { from: account });
        }).then(function(result) {
          console.log("Device location updated:", result);
        }).catch(function(err) {
          console.error("Error updating location", err.message);
        });
      });
    },
        
  
  
  };
  
  $(function() {
    $(window).load(function() {
      App.init();
      setInterval(App.updateLocationPeriodically, 360000);
    });
  });