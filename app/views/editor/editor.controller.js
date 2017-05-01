/* global angular */

import _ from 'lodash';
import yaml from 'js-yaml';
import Papa from 'papaparse';

if (!String.prototype.endsWith) {
  /* eslint no-extend-native: 0 */
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.lastIndexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

export default class EditorController {
  // constructor arglist must match invocation in app.js
  constructor($scope, $http, $timeout, $location, $anchorScroll, uiGridConstants, uiGridEditConstants, session) {
    var that = this;
    this.name = 'Bogus property for unit testing';
    this.$scope = $scope;
    this.$http = $http;
    this.$timeout = $timeout;
    this.$location = $location;
    this.$anchorScroll = $anchorScroll;
    this.uiGridConstants = uiGridConstants;
    this.uiGridEditConstants = uiGridEditConstants;
    this.examplesPattern = [
      {
        url: 'examples/beer.yaml',
        title: 'Pattern: Beer (Local)',
        type: 'yaml'
      },
      {
        url: 'examples/beer_yeast.yaml',
        title: 'Pattern: Beer Yeast (Local)',
        type: 'yaml'
      },
      {
        url: 'examples/beer_yeast_anatomy.yaml',
        title: 'Pattern: Beer Yeast Anatomy (Local)',
        type: 'yaml'
      },
      {
        url: 'examples/exposure_to_chemical.yaml',
        title: 'Pattern: Exposure to Chemical (Local)',
        type: 'yaml'
      },
      {
        url: 'examples/abnormalLevelOfChemicalInEntity.yaml',
        title: 'Pattern: Abnormal Level of Chemical in Entity (Local)',
        type: 'yaml'
      },
      {
        url: 'examples/exposure_to_levels_in_medium.yaml',
        title: 'Pattern: Exposure to Levels in Medium (Local)',
        type: 'yaml'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_chemical.yaml',
        title: 'Pattern: Exposure to Chemical (Remote)',
        type: 'yaml'
      },
      {
        url: 'https://raw.githubusercontent.com/obophenotype/upheno/master/src/patterns/abnormalLevelOfChemicalInEntity',
        title: 'Pattern: Abnormal Level of Chemical in Entity (Remote)',
        type: 'yaml'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/patterns/exposure_to_levels_in_medium.yaml',
        title: 'Pattern: Exposure to Levels in Medium (Remote)',
        type: 'yaml'
      }
    ];
    this.examplesXSV = [
      // {
      //   url: 'examples/beer.csv',
      //   title: 'Beer CSV (Local)',
      //   type: 'csv'
      // },
      // {
      //   url: 'examples/beer_yeast.csv',
      //   title: 'Beer Yeast CSV (Local)',
      //   type: 'csv'
      // },
      {
        url: 'examples/exposure_to_chemical.csv',
        title: 'Exposure to Chemical CSV (Local)',
        type: 'csv'
      },
      {
        url: 'https://raw.githubusercontent.com/cmungall/environmental-conditions/master/src/ontology/modules/exposure_to_chemical.csv',
        title: 'Exposure to Chemical CSV (Remote)',
        type: 'csv'
      },
      {
        url: 'https://raw.githubusercontent.com/monarch-initiative/hpo-annotation-data/82ffee0d369b445bea04eafcd54e242cae29e546/rare-diseases/annotated/OMIM-154400.tab?token=ACVkebM8gDm2c0fImV7zau54Td4bUTl1ks5ZCdI7wA%3D%3D',
        title: 'HPO TSV ACROFACIAL DYSOSTOSIS 1 (Remote)',
        type: 'tsv'
      },
      {
        url: 'https://gist.githubusercontent.com/DoctorBud/8d2f7e33d0055c13f310f1e767225ffa/raw/25041c5926ac90977f8c6a86523fe1a19133eb5d/genetest.tsv',
        title: 'HPO TSV Fake Debugging Example (Remote)',
        type: 'tsv'
      }
    ];
    this.exportedXSV = null;


    this.session = session;
    if (session.initialized) {
      // console.log('session.initialized');
    }
    else {
      // console.log('!session.initialized');
      session.showPatternSource = false;
      session.showPatternParsed = false;
      this.setErrorPattern(null);
      session.patternURL = null;
      session.defaultpatternURL = this.examplesPattern[1].url;

      session.defaultConfigURL = './config.yaml';

      session.showXSVSource = false;
      session.showXSVParsed = false;
      session.sourceXSV = '';
      session.titleXSV = '';
      session.errorMessageXSV = null;
      this.setErrorXSV(null);

      session.XSVURL = null;
      session.defaultXSVURL = null; // this.examplesXSV[1].url;

      var searchParams = this.$location.search();
      if (searchParams.config) {
        var config = searchParams.config;
        that.loadURLConfig(config);
      }
      else if (that.session.defaultConfigURL) {
        that.loadURLConfig(that.session.defaultConfigURL);
      }
    }
    this.$scope.$watch('editorCtrl.session.filePattern', function () {
      that.loadFilePattern(that.session.filePattern);
    });
    this.$scope.$watch('editorCtrl.session.fileXSV', function () {
      that.loadFileXSV(that.session.fileXSV);
    });

    this.setupGrid();
  }

  debugFormat(o) {
    return JSON.stringify(Object.keys(o));
  }

  getCellTitle() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
      if (cell) {
        result = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
      }
    }

    return result;
  }

  getCellURL() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
      if (cell) {
        var colName = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
        var row = this.gridApi.cellNav.getFocusedCell().row.entity;
        var acEntry = this.session.autocompleteRegistry[colName];
        if (acEntry) {
          var colId = row[acEntry.idColumn];

          result = acEntry.iriPrefix + colId.replace(':', '_');
        }
        else {
          result = 'http://www.ebi.ac.uk/ols/search?q=' + encodeURI(row[colName]);
        }
      }
    }

    return result;
  }

  getCellDetails() {
    var result = '';
    if (this.gridApi) {
      var cell = this.gridApi.cellNav.getFocusedCell();
      if (cell) {
        var colName = this.gridApi.cellNav.getFocusedCell().col.colDef.name;
        var row = this.gridApi.cellNav.getFocusedCell().row.entity;
        var acEntry = this.session.autocompleteRegistry[colName];
        if (acEntry) {
          var colId = row[acEntry.idColumn];
          var colLabel = row[acEntry.labelColumn];

          result = colLabel + ' (' + colId + ')';
        }
        else {
          result = colName + ' (' + row[colName] + ')\n';
        }
      }
    }

    return result;
  }

  getTerm(rowEntity, colName, val) {
    var acEntry = this.session.autocompleteRegistry[colName];
    var oldValue = rowEntity[colName];

    if (acEntry.labelColumn) {
      if (val === oldValue) {
        val = rowEntity[acEntry.labelColumn];
      }
      oldValue = rowEntity[acEntry.labelColumn];
    }
    // console.log('getTerm', colName, oldValue, val, acEntry, this.session.autocompleteRegistry);

    if (acEntry && acEntry.lookup_type === 'golr') {
      return this.session.golrLookup(colName, oldValue, val, acEntry);
    }
    else if (acEntry && acEntry.lookup_type === 'ols') {
      return this.session.olsLookup(colName, oldValue, val, acEntry);
    }
    else {
      return this.session.monarchLookup(colName, oldValue, val, acEntry);
    }
  }

  termSelected(item, model, label, event) {
    var cellNav = this.gridApi.cellNav;
    var cell = cellNav.getFocusedCell();
    var cellName = cell.col.colDef.name;
    var cellValue = cell.row.entity[cellName];

    if (this.isAutocompleteColumn(cellName)) {
      var acEntry = this.session.autocompleteRegistry[cellName];
      // console.log('termSelected', acEntry, cellName, cellValue);
      if (acEntry) {
        if (acEntry.idColumn) {
          cell.row.entity[acEntry.idColumn] = cellValue.id;
        }
        else {
          cell.row.entity[cellName] = cellValue.id;
        }
        if (acEntry.labelColumn) {
          cell.row.entity[acEntry.labelColumn] = cellValue.name;
        }
      }
      else {
        cell.row.entity[cellName] = cellValue.id;
        if (cellValue.label) {
          var labelField = (cellName + ' label');
          cell.row.entity[labelField] = cellValue.name;
        }
      }
    }
    else {
      cell.row.entity[cellName] = cellValue;
    }

    this.$scope.$broadcast(this.uiGridEditConstants.events.END_CELL_EDIT);
  }

  addRow() {
    var that = this;
    var selCell = this.gridApi.cellNav.getFocusedCell();
    var selRow = null;
    if (selCell) {
      selRow = selCell.row.entity;
    }
    else if (this.session.rowData.length > 0) {
      selRow = this.session.rowData[this.session.rowData.length - 1];
    }
    else {
      selRow = {};
    }
    var newRow = angular.copy(selRow);
    // newRow['Disease ID'] = '';
    // newRow['Disease Name'] = '';
    // newRow.iri = '';
    // newRow['iri label'] = '';
    this.session.rowData.push(newRow);
    // this.gridApi.core.handleWindowResize();

    this.$timeout(function() {
      var rows = that.$scope.gridApi.grid.getVisibleRows();
      // var rows = that.gridOptions.data;
      var row = rows[rows.length - 1];
      // $scope.gridOptions.data[rowIndex], $scope.gridOptions.columnDefs[colIndex]);

      // that.$anchorScroll('bottom_of_page');

      that.$scope.gridApi.cellNav.scrollToFocus(
        row.entity,
        that.$scope.gridApi.grid.columns[0]);

      // that.$timeout(function() {
      //   that.$anchorScroll.yOffset = -800;
      //   that.$anchorScroll('scroll_anchor_' + row.uid);
      //   console.log('scroll_anchor_' + row.uid);
      // }, 100);
    }, 100);
  }

  // Config stuff

  setErrorConfig(error) {
    this.session.errorMessageConfig = error;
    this.session.titleConfig = '';
    this.session.sourceConfig = '';
    this.session.parsedConfig = null;
  }

  parseConfig() {
    var that = this;
    this.session.parseConfig(function() {
      var searchParams = that.$location.search();

      var patternUrl;
      if (searchParams.yaml) {
        patternUrl = searchParams.yaml;
      }
      else if (that.defaultpatternURL) {
        patternUrl = that.defaultpatternURL;
      }

      if (patternUrl) {
        that.loadURLPattern(patternUrl);
      }


      var xsvUrl;
      if (searchParams.xsv) {
        xsvUrl = searchParams.xsv;
      }
      else if (that.defaultXSVURL) {
        xsvUrl = that.defaultXSVURL;
      }

      if (xsvUrl) {
        that.loadURLXSV(xsvUrl);
      }
    });
  }

  loadSourceConfig(source, title, url) {
    this.session.sourceConfig = source;
    this.session.titleConfig = title;
    this.session.configURL = url;
    this.session.errorMessageConfig = null;
    if (url) {
      var search = this.$location.search();
      search.config = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }
    this.parseConfig();
  }

  loadURLConfig(configURL) {
    var that = this;
    this.session.configURL = configURL;
    this.$http.get(configURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourceConfig(result.data, configURL, configURL);
      },
      function(error) {
        that.setErrorConfig('Error loading URL ' + configURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourceConfigItem(source, title, url) {
    if (source) {
      this.loadSourceConfig(source, title, url);
    }
    else {
      this.loadURLConfig(url);
    }
  }

  loadFileConfig(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourceConfig(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


  // Pattern stuff

  setErrorPattern(error) {
    if (error) {
      console.log('#setErrorPattern', error);
    }
    this.session.errorMessagePattern = error;
    this.session.titlePattern = '';
    this.session.sourcePattern = '';
    this.session.parsedPattern = null;
  }

  stripQuotes(s) {
    return s.replace(/^'/, '').replace(/'$/, '');
  }

  loadSourcePattern(source, title, url) {
    var that = this;
    this.session.sourcePattern = source;
    this.session.titlePattern = title;
    this.session.patternURL = url;
    this.session.errorMessagePattern = null;
    if (url) {
      var search = this.$location.search();
      search.yaml = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }

    this.session.parsePattern(function() {
      var fields = [];
      _.each(that.session.parsedPattern.vars, function(v, k) {
        fields.push(that.stripQuotes(v) + ' ID');
        fields.push(that.stripQuotes(v));
      });
      that.session.columnDefs = that.generateColumnDefsFromFields(fields);
      that.session.rowData = [];
      that.gridOptions.columnDefs = that.session.columnDefs;
      that.gridOptions.data = that.session.rowData;
      that.$timeout(function() {
        that.gridApi.core.handleWindowResize();
      }, 0);
    });
  }

  loadURLPattern(patternURL) {
    var that = this;
    this.session.patternURL = patternURL;
    this.$http.get(patternURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourcePattern(result.data, patternURL, patternURL);
      },
      function(error) {
        that.setErrorPattern('Error loading URL ' + patternURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourcePatternItem(source, title, url) {
    if (source) {
      this.loadSourcePattern(source, title, url);
    }
    else {
      this.loadURLPattern(url);
    }
  }

  loadFilePattern(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourcePattern(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }


// XSV stuff

  setErrorXSV(error) {
    this.session.errorMessageXSV = error;
    this.session.titleXSV = '';
    this.session.sourceXSV = '';
    this.session.parsedXSV = null;
  }

  generateColumnDefsFromFields(fields) {
    var that = this;
    function sanitizeColumnName(f) {
      return f.replace('(', '_').replace(')', '_');
    }

    var fieldsWithIRI = angular.copy(fields);
    fieldsWithIRI.unshift('IRI Label');
    fieldsWithIRI.unshift('IRI');

    var columnDefs = _.map(fieldsWithIRI, function(f) {
      var sanitizedName = sanitizeColumnName(f);
      var result = {
        name: sanitizedName,
        field: sanitizedName,
        displayName: f,
        minWidth: 100,
        enableCellEdit: false,
        enableCellEditOnFocus: false
      };

      if (that.isAutocompleteColumn(f)) {
        result.enableCellEditOnFocus = true;
        result.cellTemplate = 'cellStateTemplate';
        result.editableCellTemplate = 'cellStateAutocompleteTemplate';
        result.enableCellEdit = true;
      }
      else if (that.isEditableColumn(f)) {
        result.enableCellEditOnFocus = true;
        result.cellTemplate = 'cellStateTemplate';
        result.editableCellTemplate = 'cellStateEditableTemplate';
        result.enableCellEdit = true;
      }
      else {
        result.cellTemplate = 'cellStateReadonlyTemplate';
      }

      return result;
    });

    var lastCol = columnDefs[columnDefs.length - 1];
    if (lastCol && (!lastCol.name || lastCol.name.length === 0)) {
      columnDefs.length = columnDefs.length - 1;
    }

    return columnDefs;
  }

  generateRowDataFromXSV(data) {
    var rowData = _.map(data, function(row) {
      // Not much going on here; this is just an identity mapping for now
      // But other types of transformation might be necessary in the future.
      return row;
    });

    return rowData;
  }

  parseXSV() {
    var that = this;
    this.session.parseXSV(function() {
      that.session.columnDefs = that.generateColumnDefsFromFields(that.session.parsedXSV.meta.fields);
      that.session.rowData = that.generateRowDataFromXSV(that.session.parsedXSV.data);

      that.gridOptions.columnDefs = that.session.columnDefs;
      that.gridOptions.data = that.session.rowData;
      that.$timeout(function() {
        that.gridApi.core.handleWindowResize();
      }, 0);
    });
  }

  loadSourceXSV(source, title, url) {
    this.session.sourceXSV = source;
    this.session.titleXSV = title;
    this.session.XSVURL = url;
    this.session.errorMessageXSV = null;
    if (url) {
      var search = this.$location.search();
      search.xsv = url;
      this.$location.search(search);
    }
    else {
      this.$location.search({});
    }
    this.parseXSV();
  }

  loadURLXSV(XSVURL) {
    var that = this;
    this.session.XSVURL = XSVURL;
    this.$http.get(XSVURL, {withCredentials: false}).then(
      function(result) {
        that.loadSourceXSV(result.data, XSVURL, XSVURL);
      },
      function(error) {
        console.log('loadURLXSV error', error);
        that.setErrorXSV('Error loading URL ' + XSVURL + '\n\n' + JSON.stringify(error));
      }
    );
  }

  loadSourceXSVItem(source, title, url) {
    if (source) {
      this.loadSourceXSV(source, title, url);
    }
    else {
      this.loadURLXSV(url);
    }
  }

  loadFileXSV(file) {
    var that = this;
    if (file) {
      if (!file.$error) {
        var reader = new FileReader();
        var blobText = '';
        reader.addEventListener("loadend", function() {
          blobText = reader.result;
          that.loadSourceXSV(blobText, file.name);
        });
        reader.readAsText(file);
      }
    }
  }



  // Grid stuff

  isAutocompleteColumn(f) {
    var acEntry = this.session.autocompleteRegistry[f];
    var result = !!acEntry;
    // console.log('isAutocompleteColumn', f, result);
    return result;
  }

  isEditableColumn(f) {
    var acEntry = this.session.autocompleteRegistry[f];
    var result = !acEntry;
    // console.log('isEditableColumn', f, result);
    return result;
  }


  setupGrid() {
    var that = this;

    this.gridApi = null;
    this.gridOptions = {
      rowHeight: 80,
      enableCellSelection: false,
      // rowEditWaitInterval: -1,
      enableCellEdit: false,
      enableCellEditOnFocus: false,
      multiSelect: false,
      rowTemplate: 'TERowTemplate'
    };

    this.$scope.noResults = false;
    this.$scope.debugFormat = angular.bind(this, this.debugFormat);
    this.$scope.getTerm = angular.bind(this, this.getTerm);
    this.$scope.termSelected = angular.bind(this, this.termSelected);
    this.$scope.modelOptions = {
      debounce: {
        default: 500,
        blur: 250
      },
      getterSetter: true
    };

    this.lastCellEdited = null;
    this.gridOptions.onRegisterApi = function(gridApi) {
      that.gridApi = gridApi;
      that.$scope.gridApi = gridApi;

      gridApi.edit.on.beginCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("beginCellEdit: " + angular.toJson(colDef.field));
      });

      gridApi.edit.on.afterCellEdit(that.$scope, function(rowEntity, colDef, newValue, oldValue) {
        // console.log("afterCellEdit: " + angular.toJson(colDef.field));
        that.lastCellEdited = '[' + rowEntity.iri + '][' + colDef.name + ']: ' + oldValue + '-->' + newValue;
      });

      gridApi.edit.on.cancelCellEdit(that.$scope, function(rowEntity, colDef) {
        // console.log("cancelCellEdit: " + angular.toJson(colDef.field));
      });

      gridApi.cellNav.on.viewPortKeyDown(that.$scope, function(event, newRowCol) {
          var row = newRowCol.row;
          var col = newRowCol.col;
          if (event.keyCode === 32) {
            that.$scope.gridApi.cellNav.scrollToFocus(
              row.entity,
              that.$scope.gridApi.grid.columns[that.$scope.gridApi.grid.columns.length - 1]);
          }
      });

      gridApi.cellNav.on.navigate(that.$scope, function(newRowCol, oldRowCol) {
          // console.log('navigate', newRowCol, oldRowCol);
          that.$scope.$broadcast(that.uiGridEditConstants.events.END_CELL_EDIT);
          that.$scope.noResults = false;
      });

      that.$timeout(function() {
        if (that.session.columnDefs) {
          that.gridOptions.columnDefs = that.session.columnDefs;
          that.gridOptions.data = that.session.rowData;
        }
        that.gridApi.core.handleWindowResize();
      }, 0);
    };
  }
}

EditorController.$inject = ['$scope', '$http', '$timeout', '$location', '$anchorScroll',
                          'uiGridConstants', 'uiGridEditConstants', 'session'];

