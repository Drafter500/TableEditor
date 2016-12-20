function TableEdit() {
	this.cellIndexForElement = function(el) {
		return { row : $(el).closest('tr').index(),
				col : $(el).closest('td').index() }
	};

	function makeCellEditable(classSuffix, value, isNewItem = false) {
		return '<input type="text" class="input-' + 
		classSuffix + (isNewItem ? " new-item" : "") +
			'" value="' + value + '">';
	}

	function activateEditingMode() {
		tableBody.children('tr').each(function() {
			var i = 0;
			for(var i = 0; i < columnNames.length; i++) {
				var td = $(this).children('td')[i];
				var cellDiv = $(td).find('.cell');
				var currentText = $(cellDiv).text();
				$(cellDiv).html(makeCellEditable(
					columnNames[i], currentText));				
			}
		});
		self.addEmptyRow();
		$('td input[type=text]').on('change', onInputChanged);
		activateResizeMode();
	}

	function onInputChanged() {
		var index = self.cellIndexForElement(this);
		updateData(index.row, index.col, $(this).val());
	}

	function updateLocalStorage() {
		localStorage['tableData'] = JSON.stringify(tableData);
	}

	function updateData(row, col, value) {
		tableData[row][columnNames[col]] = value;
		updateLocalStorage();
	}

	this.addEmptyRow = function() {
		tableBody = this.table.find('tbody');
		tableBody.append("<tr></tr>");
		// var newRowText = '<tr>';
		// for (var i = 0; i < columnNames.length; i++) {
		// 	newRowText += "<td><div class=\"cell\">" + 
		// 	makeCellEditable(columnNames[i], '', true) +
		// 	"</div></td>";
		// }
		// newRowText += "<td></td>"
		// newRowText += '</tr>'
		// tableBody.append(newRowText);
		// $('.new-item').on('change', newItemChanged);
		// $('.new-item').on('change', onInputChanged);		
	}

	function deactivateEditingMode() {
		$('input[type=text]').off();
		tableBody.children('tr').each(function() {
			$(this).children('td').each(function() {
				var currentText = $(this).find('input').val();
				var cellDiv = $(this).find('.cell');
				$(cellDiv).html(currentText);
			});
		});
		tableBody.children('tr').last().remove();
		deactivateResizeMode();
	}

	function newItemChanged() {
		var newItemDirty = false;
		tableBody.find('.new-item').each(function(){
			if ($(this).val != '') {
				newItemDirty = true;
				return false;				
			}
		});

		if (newItemDirty) {
			tableBody.find('.new-item').each(function() {
				$(this).removeClass('new-item');
				$(this).off('change', newItemChanged);			
			});
			tableBody.children('tr').last().children("td").last()
			.html(deleteButton);				
			
			tableData.push({});
			self.addEmptyRow();
		}
	}

	function populateTable() {
		var tableText = "";
		for(var i = 0; i < tableData.length; i++) {
			tableText += "<tr>";
			for (var j = 0; j < columnNames.length; j++) {
				var cellValue = 
					(tableData[i][columnNames[j]] !== undefined) ?
					tableData[i][columnNames[j]] : "";
				tableText += ("<td><div class=\"cell\">" + cellValue + "</div></td>");				
			}
			tableText += "<td><div class=\"cell\">" + deleteButton + "</div></td>";
			tableText += "</tr>";
		}		
		tableBody.append(tableText);
	}

	function connectDeleteButtons() {
		$('tbody').on('click', '.delete-btn', function() {
			deleteRow($(this).closest('tr').index());
		});
	}

	function deleteRow(row) {
		tableBody.children('tr')[row].remove();
		tableData.splice(row, 1);
		updateLocalStorage();
	}	

	function getHeaderCell(resizer) {
		var cell = $(resizer).closest('td');
		var col = $(cell).index();
		return self.table.find('th:nth-child(' + (col + 1)+ ')');
	}

	function columnCount() {
		return tableBody.children("tr:first-child").children('td').length;
	}	

	function resizeColumn(headerCell, cellWidth, nextCellWidth, tableWidth, difference) {
		var col = $(headerCell).index();
		$(headerCell).css('width', cellWidth + difference);

		if (col == columnCount() - 1) {			
			self.table.css('width', tableWidth + difference);
		}	

		if ((columnCount() > 1) && (col < columnCount() - 1)) {	
			$(headerCell).next('th').css('width', nextCellWidth - difference);
		}
	}

	function getWidth(element) {
		return parseInt(element.css('width'), 10);
	}

	function activateResizeMode() {
		tableBody.children('tr').each(function() {
			$(this).children('td').each(function() {
				var cellDiv = $(this).find('.cell');
				$(cellDiv).append(resizerLine);				
			});
		});

		$('.left-resizer').on('mouseover', function(){
			$(this).css('cursor', 'ew-resize');
		});

		var xBeforeMove;
		var xAfterMove;
		var borderCaptured = false;
		var capturedHeaderCell;
		var widthBeforeMove;
		var nextWidthBeforeMove;
		var tableWidthBeforeMove;
		$('table')
		.on('mousedown', '.left-resizer', function(e) {			
			xBeforeMove = e.clientX;
			borderCaptured = true;	
			capturedHeaderCell = getHeaderCell(this);
			widthBeforeMove = getWidth($(capturedHeaderCell));
			nextWidthBeforeMove = getWidth($(capturedHeaderCell).next('th'));
			tableWidthBeforeMove = getWidth(self.table);		
			$(capturedHeaderCell).css('width', widthBeforeMove);		
		})		

		$(window).on('mousemove', function(e) {		
			xAfterMove = e.clientX;
			if (borderCaptured && (xAfterMove != xBeforeMove)) {				
				var diff = xAfterMove - xBeforeMove;
				resizeColumn(capturedHeaderCell, widthBeforeMove, nextWidthBeforeMove, tableWidthBeforeMove, diff);
			}
		})
		.on('mouseup', function() {
			borderCaptured = false;
		});
	}

	function deactivateResizeMode() {
		tableBody.children('tr').each(function() {
			$(this).children('td').each(function() {
				$(this).find('.left-resizer').remove();							
			});
		});
	}

	function fetchTableData() {
		if (localStorage["tableData"]) {
			tableData = JSON.parse(localStorage["tableData"]);
		}
		else {
			tableData =
				[{ name: "John", age: 29, country: 'USA' },
				{ name: "Paul", age: 27, country: 'Germany' },
				{ name: "Vladimir", age: 26, country: 'Russia' }]
		}	
	}

	this.initialize = function() {
		fetchTableData();
		populateTable(tableData);
		connectDeleteButtons();	

		// Firefox remembers form state after page refresh
		$('#edit-table-check').prop('checked', false);
		$('#edit-table-check').on('change', function() {
			if(this.checked) {
				activateEditingMode();
			}
			else {
				deactivateEditingMode();
			}
		});		
	}

	var self = this;
	this.table = $('table');
	var tableBody = this.table.find('tbody');
	const deleteButton = "<button class=\"delete-btn\">Delete</button>";
	const resizerLine = "<div class=\"left-resizer\"></div>";	
	var tableData = [];
	const columnNames = ['name', 'age', 'country'];

	this.getBody = function() { return tableBody; }
}

$(document).ready(function() {
	var tableEdit = new TableEdit();
	tableEdit.initialize();
});