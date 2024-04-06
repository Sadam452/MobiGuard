App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load devices manufactured.
    $.getJSON('../devices.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.status').text(data[i].status);
        petTemplate.find('.imei').text(data[i].IMEI);
        petTemplate.find('.location').text(data[i].location);
        petTemplate.find('.btn-report').attr('data-id', data[i].id);
        petTemplate.find('.btn-purchase').attr('data-id', data[i].id);
        // Check if the device is sold or not
        if (data[i].status === 'Not Sold') {
          // If not sold, show the purchase button
          petTemplate.find('.btn-purchase').show();
          petTemplate.find('.btn-report').hide();
        } else {
          // If sold, show the report lost button
          petTemplate.find('.btn-purchase').hide();
          petTemplate.find('.btn-report').show();
        }

        petsRow.append(petTemplate.html());
      }
    });

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

  // Function to initialize Web3
  // initWeb3: async function() {
  //   let web3;
  //   const Web3 = require('web3');

  //   // Initialize web3 provider
  //   if (window.ethereum) {
  //     web3 = new Web3(window.ethereum);
  //     try {
  //       await window.ethereum.request({ method: 'eth_requestAccounts' });
  //       console.log("Web3 enabled by user");
  //     } catch (error) {
  //       console.error("User denied account access:", error);
  //     }
  //   } else if (window.web3) {
  //     web3 = new Web3(window.web3.currentProvider);
  //   } else {
  //     console.error("No web3 provider detected, falling back to localhost");
  //     web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
  //   }

  //   return web3;
  // },


  initContract: function() {
    // Load Adoption contract artifact
    $.getJSON('MobileDevice.json', function(data) {
        // Initialize contract with the loaded artifact
        var MobileDeviceArtifact = data;
        App.contracts.MobileDevice = TruffleContract(MobileDeviceArtifact);
        App.contracts.MobileDevice.setProvider(App.web3Provider);
        //check if any device is already sold or lost
        // console.error('Contract loaded. Marking adopted devices...');
        App.markDevices();
    }).fail(function() {
        console.error("Failed to load contract");
    });

    // Bind events
    return App.bindEvents();
  },

  bindEvents: function() {
    // Bind event handler for purchase button
    $(document).on('click', '.btn-purchase', App.handlePurchase);
    
    // Bind event handler for report loss button
    $(document).on('click', '.btn-report', App.handleReportLoss);
    //bind register button
    $(document).on('click', '.register', App.handleRegister);
    $(document).on('click', '.show-devices', App.showDevicesInit);
  },


  markDevices: function() {
    var MobileDeviceInstance;

    // Ensure that the Adoption contract is deployed and initialized
    App.contracts.MobileDevice.deployed().then(function(instance) {
        MobileDeviceInstance = instance;

        // Ensure that adoptionInstance is not undefined
        if (MobileDeviceInstance) {
            // Call the getAdopters function
            return MobileDeviceInstance.getDevice.call();
        } else {
            throw new Error("contract instance is undefined");
        }
    }).then(function(devices) {
        // Process the result
        for (var i = 0; i < devices.length; i++) {
            // Check if the device is adopted
            //console.log("Device no:"+devices[i]+" "+devices.length+" "+i);
            if (devices[i] !== "0x0000000000000000000000000000000000000000") {
                // If sold, mark as sold and show only report loss button
                $('.panel-pet').eq(i).find('.status').text('Sold');
                $('.panel-pet').eq(i).find('.btn-report').show();
                $('.panel-pet').eq(i).find('.btn-purchase').hide();
            } else {
                // If not adopted, hide both buttons
                $('.panel-pet').eq(i).find('.status').text('Not Sold');
                $('.panel-pet').eq(i).find('.btn-report').hide();
                $('.panel-pet').eq(i).find('.btn-purchase').show();
            }
        }
    }).catch(function(err) {
        // Handle errors
        console.error(err.message);
    });
    //check for devices lost
    App.contracts.MobileDevice.deployed().then(function(instance) {
        MobileDeviceInstance = instance;

        // Ensure that adoptionInstance is not undefined
        if (MobileDeviceInstance) {
            // Call the getAdopters function
            return MobileDeviceInstance.getLost.call();
        } else {
            throw new Error("contract instance is undefined");
        }
    }).then(function(devices) {
        // Process the result
        for (var i = 0; i < devices.length; i++) {
            // Check if the device is adopted
            // console.log("Device no:"+devices[i]+" "+devices.length+" "+i);
            if (devices[i] !== "0x0000000000000000000000000000000000000000") {
                // If lost, mark as lost and hide buttons
                $('.panel-pet').eq(i).find('.status').text('Lost');
                $('.panel-pet').eq(i).find('.btn-report').show();
                $('.panel-pet').eq(i).find('button').text('Report Theft').attr('disabled', true);
                $('.panel-pet').eq(i).find('.btn-purchase').hide();
            }
        }
    }).catch(function(err) {
        // Handle errors
        console.error(err.message);
    });
  },



  handlePurchase: function(event) {
    event.preventDefault();

    var deviceId = parseInt($(event.target).data('id'));

    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }

      var account = accounts[0];

      App.contracts.MobileDevice.deployed().then(function(instance) {
        adoptionInstance = instance;
        // Purchase the device
        return adoptionInstance.purchase(deviceId, { from: account });
      }).then(function(result) {
        console.log("Device purchased:", result);
        // Update UI to mark the device as sold
        $(event.target).hide();
        $(event.target).closest('.panel-pet').find('.btn-report').show();
        $(event.target).closest('.panel-pet').find('.status').text('Sold');
      }).catch(function(err) {
        console.error("Error purchasing device:", err.message);
      });
    });
  },

  handleReportLoss: function(event) {
    event.preventDefault();

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
            return adoptionInstance.markLost(deviceId, { from: account });
        }).then(function(result) {
            console.log("Device marked as lost:", result);
            // Update UI to mark the device as lost
            // $(event.target).text('Lost').attr('disabled', true);
            $(event.target).closest('.panel-pet').find('.status').text('Lost');
            //$(event.target).closest('.panel-pet').find('.btn-report').hide();
            $(event.target).closest('.panel-pet').find('button').text('Report Theft').attr('disabled', true);
            $(event.target).closest('.panel-pet').find('.btn-purchase').hide();
        }).catch(function(err) {
            console.error("Error marking device as lost:", err.message);
        });
    });
  },

  handleRegister: function(event) {
    // event.preventDefault();

    event.preventDefault();

    var imei = document.querySelector('.imei').value;
    var url = document.querySelector('.url').value;
    var deviceName = document.querySelector('.device-name').value;
    var location = document.querySelector('.location').value;
    console.log("Received values: "+" "+imei+" "+url+" "+deviceName+" "+location);

    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.error(error);
        }

        var account = accounts[0];

        App.contracts.MobileDevice.deployed().then(function(instance) {
            adoptionInstance = instance;
            console.log("called register device");
            return adoptionInstance.registerDevice(deviceName, imei, location, url, { from: account });
            // return adoptionInstance.setName({ from: account });
        }).then(function(result) {
            console.log("Device registered:", result);
            alert("Device registered successfully");
        }).catch(function(err) {
          alert("Error registering a device. IMEI used or image url is invalid.");
            console.error("Error registering a device.", err.message);
        });
    });
},

// showDevices: async function(event) {
//     event.preventDefault();
//     web3.eth.getAccounts(function(error, accounts) {
//       if (error) {
//           console.error(error);
//       }
//       var account = accounts[0];
//     App.contracts.MobileDevice.deployed().then(function(instance) {
//       adoptionInstance = instance;
//       console.log("called get devices");
//       return adoptionInstance.getRegisteredDevices();
//     }).then(function(result) {
//       // var ethJSABI = require("ethjs-abi");
//       console.log("web3.eth.abi status: "+web3.eth.abi);
//       console.log("web3.eth "+web3.eth);
//       // result = "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000647616c617879000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000635363534343600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000094e65772064656c6869000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001668747470733a2f2f7777772e676f6f676c652e636f6d00000000000000000000";

//       console.log("Result: "+result);
//       // Convert the returned data to a string
//     let dataString = web3.utils.hexToUtf8("0x"+result);
//     console.log("Data String: "+dataString);

//     // Now parse the string to extract individual data elements
//     let dataArray = dataString.split(',');

//     // Process each data element as needed
//     for (let i = 0; i < dataArray.length; i++) {
//         console.log("Data Element " + i + ": " + dataArray[i]);
//     }

//       // var decodedDevices = web3.eth.abi.decodeParameters(
//       //   ['string[]', 'string[]', 'string[]', 'string[]'],
//       //   result
//       // );
//       // // Now you can access the decoded arrays
//       // var names = decodedDevices[0];
//       // var imeis = decodedDevices[1];
//       // var locations = decodedDevices[2];
//       // var urls = decodedDevices[3];
//       // console.log("Names: "+names);
//       // console.log("IMEIs: "+imeis);
//       // console.log("Locations: "+locations);
//       // console.log("URLs: "+urls);
//     }).catch(function(err) {
//       alert("Error getting devices. Please try again.");
//       console.error("Error getting devices ", err.message);
//     });
  // });
// }

showDevicesInit: function(event) {
  event.preventDefault();
  var adoptionInstance;
  //get deviceCount from smart contract
  App.contracts.MobileDevice.deployed().then(function(instance) {
    adoptionInstance = instance;
    console.log("Called getDeviceCount");
    return adoptionInstance.device_Count();
  }).then(function(result) {
    console.log("Device Count q:", result.toString());
    var deviceCount = parseInt(result.toString());
    console.log("Device Count dc: " + deviceCount);
    for(let i = 0; i < deviceCount; i++) {
      App.showDevices(i);
    }
  }).catch(function(err) {
    alert("Error getting device count. Please try again.");
    console.error("Error getting device count:", err.message);
  });
},

showDevices: function(i) {
  // event.preventDefault();
      App.contracts.MobileDevice.deployed().then(function(instance) {
          adoptionInstance = instance;
          console.log("called get devices");
          return adoptionInstance.getRDevice(i);
      }).then(function(data) {
        console.log("Result: "+data[0]);
        var petsRow = $('#devices');
        var petTemplate = $('#devicesTemplate');

        //for (i = 0; i < data.length; i ++) {
          petTemplate.find('.panel-title').text(data[0]);
          petTemplate.find('img').attr('src', data[3]);
          petTemplate.find('.status').text("Will handle later");
          petTemplate.find('.imei').text(data[1]);
          petTemplate.find('.location').text(data[2]);

          petsRow.append(petTemplate.html());
        //}
      }).catch(function(err) {
          alert("Error getting devices. Please try again.");
          console.error("Error getting devices ", err.message);
      });
}
  // showDevices: async function(event) {
  //   event.preventDefault();
  //   var adoptionInstance;
  //   // Get the device count
  //   App.contracts.MobileDevice.deployed().then(async function(instance) {
  //     adoptionInstance = instance;
  //     console.log("Called getDeviceCount");
  //     let deviceCount = await adoptionInstance.getDeviceCount();
  //     console.log("Device Count:", deviceCount);
  //     // Iterate over each device
  //     for (let i = 0; i < deviceCount; i++) {
  //       adoptionInstance.getRDevice(i).then(function(result) {
  //         console.log("Device " + i + " Name:", result[0]);
  //         // Handle device details
  //       }).catch(function(err) {
  //         console.error("Error getting device details for device " + i + ":", err.message);
  //       });
  //     }
  //   }).catch(function(err) {
  //     alert("Error getting device count. Please try again.");
  //     console.error("Error getting device count:", err.message);
  //   });
  // }






};

$(function() {
  $(window).load(function() {
    App.init();
  });
});