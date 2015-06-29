'use strict';

/**
 * @ngdoc function
 * @name gapFront.controller:LabelEffectsCtrl
 * @description
 * # LabelEffectsCtrl
 * Controller of the gapFront
 */
angular.module('gapFront')
  .controller('LabelEffectsCtrl', function ($scope, IntegrationService, APIService, DrugService) {

    $scope.effects = [];
    $scope.selectedSymptom = '';
    $scope.adverseEffects = [];
    $scope.displayedStuff = [];
    $scope.percentAnswered = function(){
      return $scope.getPercentage() + '% of possible side effects addressed'
    };

    $scope.count = 0;
    $scope.total = 1;

    var initLabelEffects = function (params) {
      $scope.selectedDrug = DrugService.getSelectedDrug();
      $scope.count = 0;
      $scope.total = 1;
      var query = 'patient.drug.medicinalproduct:' + $scope.selectedDrug.brand_name;
      APIService.aggregateDrugEvent(query, 50, 'patient.reaction.reactionmeddrapt.exact').then(addFdaList, serviceError)
    };

    IntegrationService.registerIntegrationMethod('initLabelEffects', initLabelEffects);

    $scope.fetchDrugEffects = function () {
      $scope.adverseEffects = [];
      $scope.displayedStuff = [];

      APIService.getDrugsApi().get($scope.selectedDrug.brand_name).then(updateList, serviceError)
    };

    function addFdaList(resp) {
      var res = resp.results;
      for (var i in res) {
        $scope.effects.push(res[i].term);
      }
      $scope.fetchDrugEffects();
    }

    function updateList(resp) {
      $scope.adverseEffects = resp.drug.effects;
      $scope.total = $scope.adverseEffects.length > 18? 18 : $scope.adverseEffects.length;
      addDisplayedStuff();
    }

    function addDisplayedStuff() {
      var k = genRandomInt(0, $scope.adverseEffects.length);
      var effect = $scope.adverseEffects.splice(k, 1)[0];
      var sentence = findMatchingSentence($scope.selectedDrug.object, effect);
      $scope.displayedStuff.push({effect: effect, sentence: sentence});
    }

    function genRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    function serviceError(error) {
    }

    // Function which greps through the drug object to find adverse effects
    function findMatchingSentence(drugObject, effect) {
      var textToSearch = [];

      if (drugObject['boxed_warnings']) {
        textToSearch.push.apply(textToSearch, drugObject['boxed_warnings']);
      }

      if (drugObject['warnings_and_precautions']) {
        textToSearch.push.apply(textToSearch, drugObject['warnings_and_precautions']);
      }

      if (drugObject['user_safety_warnings']) {
        textToSearch.push.apply(textToSearch, drugObject['user_safety_warnings']);
      }

      if (drugObject['precautions']) {
        textToSearch.push.apply(textToSearch, drugObject['precautions']);
      }

      if (drugObject['warnings']) {
        textToSearch.push.apply(textToSearch, drugObject['warnings']);
      }

      if (drugObject['general_precautions']) {
        textToSearch.push.apply(textToSearch, drugObject['general_precautions']);
      }

      if (drugObject['warnings_and_precautions']) {
        textToSearch.push.apply(textToSearch, drugObject['warnings_and_precautions']);
      }

      if (drugObject['adverse_reactions']) {
        textToSearch.push.apply(textToSearch, drugObject['adverse_reactions']);
      }

      var found = false;

      if (Array.isArray(textToSearch)) {
        textToSearch = textToSearch.join('.');
      }

      var splitText = textToSearch.split('.');
      for (var i = 0; i < splitText.length; i++) {
        if (splitText[i].match(effect)) {
          found = true;
          break;
        }
      }

      if (found == true) {
        return (splitText.slice(i-1, i+1).join('.'));
      } else {
        var idx = Math.floor(Math.random() * splitText.length);
        return (splitText.slice(idx-1, idx+1).join('.'));
      }
    }

    // Called every time you finish one question
    $scope.completeIndex = function (index, accurate) {
      $scope.count += 1;
      var term = $scope.displayedStuff.splice(index, 1)[0];
      if ($scope.adverseEffects.length > 0) addDisplayedStuff();
      var post = {drug_name: $scope.selectedDrug.brand_name, effect: term.effect, response: accurate};
      APIService.getEffectsApi().post(post).then(serviceError, serviceError);
    };

    $scope.adverseTooltip = "Add a new adverse affect not currently reported";

    $scope.addSelectedSymptom = function () {
      var elem = $('#selsym')[0];
      var value = elem.value;
      if (contains($scope.symptoms, value) && !effectsContain(value)) {
        $scope.effects.push({medical_term: value, layman_term: value, checked: true});
        $scope.selectedSymptom = '';
        elem.value = '';
      }
    };

    $scope.getPercentage = function () {
      //console.log('count: ' + $scope.count + ' total: ' + $scope.total);
      var div = $scope.count / $scope.total;
      var percent = div * 100;
      if(percent == 100){
        $scope.showThanks = true;
      }
      return Math.floor(percent);
    };

    function effectsContain(obj) {
      var a = $scope.effects;
      for (var i = 0; i < a.length; i++) {
        if (a[i].medical_term == obj) {
          return true;
        }
      }
      return false;
    }

    function contains(a, obj) {
      for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
          return true;
        }
      }
      return false;
    }
  });
