
var sbRepair = {

	get WIZARD() { return document.getElementById("sbRepairWizard"); },
	get TREE()   { return document.getElementById("sbRepairTree"); },

	treeItems : [],

	initStartPage : function()
	{
		var nextPage;
		switch ( document.getElementById("sbRepairRadioGroup").selectedIndex )
		{
			case 0 : nextPage = "sbRepairRDF1"; break;
			case 1 : nextPage = "sbRepairFavicons"; break;
		}
		if ( nextPage ) this.WIZARD.currentPage.next = nextPage;
		this.WIZARD.canAdvance = nextPage ? true : false;
	},

	initRestoreRDF : function()
	{
		this.treeItems = [];
		var backupDir = ScrapBookUtils.getScrapBookDir();
		backupDir.append("backup");
		if ( !backupDir.exists() )
		{
			ScrapBookUtils.alert("No backup files found.");
			return;
		}
		var fileEnum = backupDir.directoryEntries;
		while ( fileEnum.hasMoreElements() )
		{
			var fileObj  = fileEnum.getNext().QueryInterface(Ci.nsIFile);
			var fileName = fileObj.leafName;
			var isMatch  = fileName.match(/^scrapbook_\d{8}\.rdf$/);
			if ( isMatch ) this.treeItems.push([fileName, (new Date(fileObj.lastModifiedTime)).toLocaleString(), fileObj.fileSize]);
		}
		var colIDs = [
			"sbRepairTreecolFile",
			"sbRepairTreecolTime",
			"sbRepairTreecolSize",
		];
		this.TREE.view = new sbCustomTreeView(colIDs, this.treeItems);
	},

	execRestoreRDF : function()
	{
		if ( this.TREE.currentIndex < 0 ) { this.WIZARD.rewind(); return; }
		var fileName = this.treeItems[this.TREE.currentIndex][0];
		if ( !fileName ) { this.WIZARD.rewind(); return; }
		var bFile = ScrapBookUtils.getScrapBookDir();
		bFile.append("backup");
		bFile.append(fileName);
		if ( !bFile.exists() || !bFile.isFile() ) { this.WIZARD.rewind(); return; }
		this.WIZARD.canRewind = false;
		try {
			ScrapBookData.restoreFromBackup(bFile);
		}
		catch (ex) {
			document.getElementById("sbRepairRDF2Label").value = "ERROR: " + ex;
		}
	},

	restoreFavicons : function()
	{
		this.WIZARD.canRewind = false;
		var shouldFlush = false;
		var i = 0;
		var resEnum = ScrapBookData.dataSource.GetAllResources();
		while ( resEnum.hasMoreElements() )
		{
			var res  = resEnum.getNext().QueryInterface(Ci.nsIRDFResource);
			var id   = ScrapBookData.getProperty(res, "id");
			var icon = ScrapBookData.getProperty(res, "icon");
			if ( res.Value == "urn:scrapbook:root" || res.Value == "urn:scrapbook:search" ) continue;
			if ( ++i % 10 == 0 ) document.getElementById("sbRepairFaviconsTextbox").value = res.Value;
			if ( icon.match(/(\d{14}\/.*$)/) )
			{
				var newIcon = "resource://scrapbook/data/" + RegExp.$1;
				if ( icon != newIcon )
				{
					ScrapBookData.setProperty(res, "icon", newIcon);
				}
			}
		}
		document.getElementById("sbRepairFaviconsTextbox").value = document.getElementById("sbRepairRDF2Label").value;
		window.opener.reload();
	},

};



