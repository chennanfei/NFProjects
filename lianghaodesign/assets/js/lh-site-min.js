TM.configure({baseUrl:'assets/js',debugEnabled:false,dependencies:{config:['jquery']},modules:{config:'lh-site-min.js',jquery:'lib/jquery-1.11.0.js'},pages:{loading:{controller:'lh.controller.LoadingController',module:'config'},life:{controller:'lh.controller.LifeController',module:'config'},work:{controller:'lh.controller.WorkController',module:'config'}}});TM.declare('lh.controller.BaseController').inherit('thinkmvc.Controller').extend({animateTime:{NORMAL:300,FAST:200,SLOW:500,VERY_SLOW:1000},preventedActions:{},selectedClass:'background-stress',makeAjax:function(a,b){if(!a){throw new Error('No url was passed to ajax request.');}var c=this;return $.ajax(a,{async:true,contentType:'application/x-www-form-urlencoded; charset=UTF-8',data:b.data,dataType:b.dataType||'html',type:b.type||'GET',beforeSend:function(){b.beforeSendHandler&&b.beforeSendHandler.apply(c,arguments)},complete:function(){b.completeHandler&&b.completeHandler.apply(c,arguments)},error:function(){b.errorHandler&&b.errorHandler.apply(c,arguments)},success:function(){b.successHandler&&b.successHandler.apply(c,arguments)}})},preventDoubleAction:function(a,b){var c=this;if(!c.preventedActions[a]){c.preventedActions[a]=true;setTimeout(function(){c.preventedActions[a]=false},b||c.animateTime.NORMAL);return false}return true}});TM.declare('lh.controller.ItemMenuController').inherit('lh.controller.BaseController').extend((function(){var g=false,$openItemContents=[];function canCloseItem(a){var i,filteredAreas=['.design-list .item','.design-list .content-detail','.sub-menu-item'];while(a&&a.length){for(i=0;i<filteredAreas.length;i++){if(a.is(filteredAreas[i])){return false}}a=a.parent()}return true}function updateLoadingPosition(){var a=this._el.$designList.parent(),$loading=this._el.$pageLoading,offset=a.offset().left+(a.width()-$loading.width())/2;$loading.css('left',offset)}function expandSubMenu(a,b){if(this.preventDoubleAction('expand-menu')){return}var c=a.hasClass(this.selectedClass);if(c&&!b){return}var d=this._el,slideTime=this.animateTime.NORMAL,selected=this.selectedClass,selectedEl='.'+selected,$selectItem=d.$menuItems.filter(selectedEl);if($selectItem.length&&!$selectItem.is(a)){$selectItem.removeClass(selected).siblings('.tm-sub-list').slideUp(slideTime)}if(b){var e=a.addClass(selected).siblings('.tm-sub-list');if(!e.is(':visible')){e.slideDown(slideTime)}}else{a.addClass(selected)}}function getLatestOpenItem(){var a;do{a=$openItemContents.pop()}while(a&&!a.is(':visible'));return a}function retrieveImages(e){var f=e.find('.image-placeholder');if(!f.length){return}f.each(function(a,b){var c=$(b),$imageContainer=c.parent(),numbers=c.data('numbers'),path=c.data('path'),i,len=numbers&&numbers.length;if(!len){return}for(i=0;i<len;i++){var d=$('<img>').attr('src',path+numbers[i]+'.jpg');$imageContainer.append(d)}});f.remove()}function retrieveSection(d,e){var f=d.data('url'),$loading=this._el.$pageLoading,self=this;if(!f||g){return}updateLoadingPosition.call(this);this.makeAjax(f,{beforeSendHandler:function(){g=true;$loading.fadeIn()},completeHandler:function(){g=false},successHandler:function(a,b,c){d.html(a).data('url',null);if(e){scrollContentToTop.call(self,d)}$loading.fadeOut()}})}function scrollContentToTop(a){var b=this._el.$mainContent.offset().top,offset=a.offset(),self=this;if(offset){$('html,body').animate({scrollTop:offset.top-b},this.animateTime.NORMAL)}}return{events:{'click document':'closeOpenItem','click .close-btn':'close','click .menu-item':'toggleSubMenu','click .sub-menu-item':'renderItemContent','scroll window':'handleScrolling'},selectors:{designList:'.design-list',mainContent:'#mainContent',menuItems:'#menu .menu-item',pageLoading:'#pageLoading',subMenuItems:'#menu .sub-menu-item'},close:function(b){b.stopPropagation();var c=this._el,$target=$(b.currentTarget),$parent=$target.closest('.content-detail'),selected=this.selectedClass,contentId=$parent.attr('id');$parent.fadeOut(this.animateTime.NORMAL,function(){var a='[data-content-id="'+contentId+'"]';c.$subMenuItems.filter(a).removeClass(selected);$target.removeClass('close-btn-status-2');$target.closest('.design-list').find('.preview-content .image'+a).parent().show()})},closeOpenItem:function(a){if(!canCloseItem($(a.target))){return}var b=getLatestOpenItem();if(b){b.find('.close-btn').click()}},handleScrolling:function(){var d=$(window),$section,distance=$(document).height()-(d.scrollTop()+d.height());if(distance<20){this._el.$designList.each(function(a,b){var c=$(b);if(c.data('url')){$section=c;return false}})}if($section){retrieveSection.call(this,$section)}else{this.updateMenu()}},toggleSubMenu:function(a){a.stopPropagation();var b=$(a.currentTarget),$subItem=b.siblings('.tm-sub-list'),$section=$('#'+b.data('itemId')),url=$section.data('url');if($subItem.is(':visible')){b.siblings('.tm-sub-list').slideUp(this.animateTime.NORMAL);return}expandSubMenu.call(this,b,true);if(url){retrieveSection.call(this,$section,true)}else{scrollContentToTop.call(this,$section)}return false},renderItemContent:function(a){a.stopPropagation();var b=$(a.currentTarget),contentId=b.data('contentId'),selected=this.selectedClass;if(!contentId||b.hasClass(selected)){return}var c=$('#'+contentId);if(!c.length){return}var d=c.parent(),$previewContent=d.children('.preview-content');b.closest('.tm-sub-list').find('.'+selected).removeClass(selected);b.addClass(selected);c.siblings('.content-detail').hide();if(!c.data('isMoved')){c.detach().insertBefore($previewContent).data('isMoved',true);retrieveImages.call(this,c)}c.fadeIn(this.animateTime.NORMAL);var e=$previewContent.find('.item');e.not(':visible').show();e.has('.image[data-content-id='+contentId+']').hide();var f=b.closest('.tm-sub-list');if(!f.is(':visible')){expandSubMenu.call(this,f.siblings('.menu-item'),true)}scrollContentToTop.call(this,d);$openItemContents.push(c)},updateMenu:function(){var d=this._el,$list=d.$designList,firstId,mainTop=d.$mainContent.offset().top;$list.each(function(a,b){var c=$(b),contentOffset=c.offset().top+c.height()-100;if(contentOffset>$(window).scrollTop()+mainTop){firstId=c.attr('id');return false}});var e=d.$menuItems.filter('[data-item-id='+firstId+']');expandSubMenu.call(this,e);return false}}})());TM.declare('lh.controller.PageController').inherit('lh.controller.BaseController').extend({events:{'mouseenter .close-btn':'toggleCloseBtn','mouseenter #footer':'toggleFooter','mouseleave .close-btn':'toggleCloseBtn','mouseleave #footer':'toggleFooter','scroll window':'moveWords'},selectors:{floatLayer:'#floatLayer',footer:'#footer',mainContent:'#mainContent'},initialize:function(){this.invoke('lh.controller.BaseController:initialize');this._el.$floatLayer.children('span').each(function(a,b){var c=$(b);c.data('origin',parseInt(c.css('top'),10))})},moveWords:function(){var d=$(window).scrollTop(),offset=d*0.8;this._el.$floatLayer.children('span').each(function(a,b){var c=$(b);c.css('top',c.data('origin')+offset)})},toggleCloseBtn:function(a){var b=0,$target=$(a.currentTarget),prefix='close-btn-status-';if(a.type==='mouseenter'){var c=setInterval(function(){if(b===2){clearInterval(c);return}$target.removeClass(prefix+b).addClass(prefix+(++b))},this.animateTime.FAST)}else{$target.removeClass('close-btn-status-2')}},toggleFooter:function(a){var b=this._el.$footer,status=b.data('status'),slideTime=this.animateTime.NORMAL;var c=parseInt(b.css('bottom'),10);if(b.data('originalBottom')===undefined){b.data('originalBottom',c)}var d=a.type==='mouseleave',bottom=d?b.data('originalBottom'):0;if(status===2||bottom===c){return}b.data('status',2);var e=function(){b.animate({bottom:bottom},slideTime,function(){b.data('status',1)})};if(d){setTimeout(e,1000)}else{e()}}});TM.declare('lh.controller.PreviewImagesController').inherit('lh.controller.BaseController').extend({events:{'click .design-list .image':'findRightItemInSubMenu','load .preview-content .image img:first':'initImageList','mouseenter .preview-content .image':'switchImages'},selectors:{menu:'#menu',previews:'#mainContent .preview-content'},findRightItemInSubMenu:function(a){var b=$(a.currentTarget).data('contentId');if(b){this._el.$menu.find('[data-content-id='+b+']').click()}},initImageList:function(a){var b=$(a.currentTarget),$container=b.closest('.image'),$images=$container.find('img'),size={width:b.width(),height:b.height()},imgCount=$images.length;if(!imgCount||!size.width){return}$container.css(size).addClass('image-float').data('ready',1);$images.css(size).show().parent().width(size.width*imgCount)},switchImages:function(a){var b=$(a.currentTarget),$images=b.find('img');if(!b.data('ready')){this.initImageList({currentTarget:$images[0]})}var c=$images.length,width=$images.eq(0).width(),nextImg=(b.data('index')||0)+1;if(nextImg>=c){nextImg=0}var d=-1*nextImg*width;$images.parent().animate({left:d},this.animateTime.NORMAL,function(){b.data('index',nextImg)})}});TM.declare('lh.controller.LoadingController').inherit('lh.controller.BaseController').extend(function(){function initImageList(){var e,el=this._el;el.$preloadedImages.each(function(b,c){var d=$(c),$img=el.$imgTemp.clone();$img.find('img').attr('src',d.attr('src')).load(function(a){$(this).parent().attr('href',d.data('url')).data('ready',1)});e=e?e.add($img):$img});el.$imgList.prepend(e);el.$preloadedImages.remove()}function switchImages(){var b=0,el=this._el,$imgLinks=el.$imgTemp.siblings('a');if(!$imgLinks.length){return}var c=this.animateTime;setInterval(function(){var a,count=0;while(true){a=$imgLinks.eq(b++%$imgLinks.length);if(a.data('ready')){break}if(++count===$imgLinks.length){return}}$imgLinks.filter(':visible').hide();a.show();if(!el.$realTitle.is(':visible')){el.$loadingTitle.hide();el.$realTitle.slideDown(c.NORMAL)}},c.SLOW)}return{events:{'mouseenter a.page-link':'toggleLinkText','mouseleave a.page-link':'toggleLinkText'},rootNode:'#loadingImages',selectors:{imgList:'.image',imgTemp:'#image-template',loadingTitle:'#loadingTitle',preloadedImages:'object',realTitle:'#realTitle'},initialize:function(){this.invoke('lh.controller.BaseController:initialize');initImageList.call(this);switchImages.call(this)},toggleLinkText:function(a){var b=$(a.currentTarget);b.children('span').toggle()}}});TM.declare('lh.controller.WorkController').inherit('lh.controller.BaseController').extend({initialize:function(){this.U.createInstance('lh.controller.PageController');this.U.createInstance('lh.controller.ItemMenuController');this.U.createInstance('lh.controller.PreviewImagesController')}});TM.declare('lh.controller.LifeController').inherit('lh.controller.BaseController').extend({initialize:function(){this.U.createInstance('lh.controller.PageController');this.U.createInstance('lh.controller.ItemMenuController');this.U.createInstance('lh.controller.PreviewImagesController')}});