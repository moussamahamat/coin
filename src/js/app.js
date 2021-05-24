App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialisation...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("DicoinTokenSale.json", function(dicoinTokenSale) {
      App.contracts.DicoinTokenSale = TruffleContract(dicoinTokenSale);
      App.contracts.DicoinTokenSale.setProvider(App.web3Provider);
      App.contracts.DicoinTokenSale.deployed().then(function(dicoinTokenSale) {
        console.log("Dicoin Token Sale Address:", dicoinTokenSale.address);
      });
    }).done(function() {
      $.getJSON("DicoinToken.json", function(dicoinToken) {
        App.contracts.DicoinToken = TruffleContract(dicoinToken);
        App.contracts.DicoinToken.setProvider(App.web3Provider);
        App.contracts.DicoinToken.deployed().then(function(dicoinToken) {
          console.log("Dicoin Token Address:", dicoinToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // ecout des evenements pour event emis par apartir de contrat Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.DicoinTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    //loader.show();
    //content.hide();
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
      }
    })

    App.loading = false;
    loader.hide();
    content.show();



    // Load token sale contract
    App.contracts.DicoinTokenSale.deployed().then(function(instance) {
      dicoinTokenSaleInstance = instance;
      return dicoinTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return dicoinTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.DicoinToken.deployed().then(function(instance) {
        dicoinTokenInstance = instance;
        return dicoinTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.DicoinTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 1000000 // limit de gas
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset')

    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});