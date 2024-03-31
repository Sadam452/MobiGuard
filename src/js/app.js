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
  },


  markDevices: function() {
    var MobileDeviceInstance;

    // Ensure that the Adoption contract is deployed and initialized
    App.contracts.MobileDevice.deployed().then(function(instance) {
        MobileDeviceInstance = instance;

        // Ensure that adoptionInstance is not undefined
        if (MobileDeviceInstance) {
            // Call the getAdopters function
            return MobileDeviceInstance.getDevice();
        } else {
            throw new Error("contract instance is undefined");
        }
    }).then(function(devices) {
        // Process the result
        for (var i = 0; i < devices.length; i++) {
            // Check if the device is adopted
            //console.log("Device no:"+devices[i]+" "+devices.length+" "+i);
            if (devices[i] !== '0x0000000000000000000000000000000000000000') {
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
            return MobileDeviceInstance.getLost();
        } else {
            throw new Error("contract instance is undefined");
        }
    }).then(function(devices) {
        // Process the result
        for (var i = 0; i < devices.length; i++) {
            // Check if the device is adopted
            if (devices[i] !== '0x0000000000000000000000000000000000000000') {
                // If lost, mark as lost and hide buttons
                $('.panel-pet').eq(i).find('.status').text('Lost');
                $('.panel-pet').eq(i).find('.btn-report').show();
                $('.panel-pet').eq(i).find('button').text('Report Loss').attr('disabled', true);
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
            $(event.target).closest('.panel-pet').find('button').text('Report Loss').attr('disabled', true);
            $(event.target).closest('.panel-pet').find('.btn-purchase').hide();
        }).catch(function(err) {
            console.error("Error marking device as lost:", err.message);
        });
    });
  }


};

$(function() {
  $(window).load(function() {
    App.init();
  });
});