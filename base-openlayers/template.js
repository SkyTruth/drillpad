BaseTemplatePage = Page = function () {
  GenericPage.apply(this, arguments);
};

Page.prototype.attaGirlInterval = 50;

Page.prototype.init = function (app, cb) {
  GenericPage.prototype.init.call(this, app, function(err, page) {
    $.ajax({url: '/api/app?short_name={{short_name}}', success: function(data) {
      page.app.pybossa = data[0];

      pybossa.taskLoaded(function(task, deferred) {
        return page.taskLoaded(task, deferred);
      });

      pybossa.presentTask(function(task, deferred) {
        return page.presentTask(task, deferred);
      });

      page.app.loadMap();

      $(".done-for-now-btn").click(function (evt) { page.doneForNow(evt); });
      $(".lots-done .continue").click(function (evt) { page.lotsDoneContinue(evt); });

      $(".alert-messages .alert a:not(.close)").addClass("btn btn-success");

      pybossa.run('{{short_name}}');

      if (cb) cb(null, page);
    }});
  });
};
Page.prototype.getAttaGirl = function(progress) {
  var page = this;
  var messages = $(".atta-boy-messages > div")
  $(".progressmsg").html($(messages[Math.floor((progress) / page.attaGirlInterval) % messages.length]).html());
  if (page.attaGirlInterval && (page.attaGirlInterval - 1 <= progress % page.attaGirlInterval)) {
    $(".lots-done").show();
  }
};
Page.prototype.doneForNow = function(evt) {
  $(".done-for-now").show();
  $(".skeleton").hide();
};
Page.prototype.lotsDoneContinue = function(evt) {
  $(".lots-done").hide();
};
Page.prototype.taskLoaded = function(task, deferred) {
  deferred.resolve(task);
};
Page.prototype.getData = function() {
  var res = JSON.parse($.cookie('{{short_name}}_data')) || {};
  if (!res.done) res.done = {};
  if (!res.timings) res.timings = {};
  if (!res.times) res.times = {};
  if (!res.total) res.total = {};
  return res;
};
Page.prototype.setData = function(data) {
  $.cookie('{{short_name}}_data', JSON.stringify(data));
};
Page.prototype.loadUserProgress = function() {
  var page = this;
  pybossa.userProgress('{{short_name}}').done(function (pybossadata) {
    var data = page.getData();
    data.done.tasks = pybossadata.done;
    data.total.tasks = pybossadata.total;
    page.setData(data);

    for (key in data.done) {
       $(".done-" + key + "-display").html(data.done[key]);
    }
    page.getAttaGirl(parseInt(data.done || 0));
    return page.app.setProgress(data);
  });
};
Page.prototype.reportAnswer = function () {
  var page = this;

  var answer = page.app.getAnswer();
  var answerdone = answer.done || {};
  // answerdone.tasks = 1; Getting this from PyBossa nowdays...
  var data = page.getData();
  for (key in answerdone) {
     if (data.done[key] == undefined) data.done[key] = 0;
     data.done[key] += answerdone[key];
  }
  var now = (new Date).getTime();
  for (key in data.times) {
    data.timings[key] = now - data.times[key];
  }
  data.times.reportAnswer = now;
  page.setData(data);
  answer.timings = data.timings;

  pybossa.saveTask(page.task.id, answer).done(function() {
    page.deferred.resolve();
  });

  $("#loading").fadeIn(500);
  if ($("#disqus_thread").is(":visible")) {
    $('#disqus_thread').toggle();
    $('.btn-disqus').toggle();
  }
};
Page.prototype.presentTask = function(task, deferred) {
  var page = this;
  page.task = task;
  page.deferred = deferred;

  var data = page.getData();
  var now = (new Date).getTime();
  data.times.presentTask = now;
  page.setData(data);

  if ( !$.isEmptyObject(task) ) {
    $('#task-id').html(task.id);
    page.loadUserProgress();
    page.app.updateMap(task);
    $("#loading").hide();
  } else {
    $(".all-done").show();
    $(".skeleton").hide();
    $("#loading").hide();
  }
};

Page.prototype.storeData = function(data, cb) {
  var page = this;

  if (data.app_id == -1) {
    data.app_id = page.app.pybossa.id;
  }
  if (data.task_id == -1) {
    data.task_id = page.app.task.id;
  }

  $.ajax({type: "POST", url: "/api/rundata", data: JSON.stringify(data), contentType: 'application/json', dataType: "json", success: cb});
};

Page.prototype.queryData = function(filter, cb) {
  if (filter.app_id == -1) {
    filter.app_id = page.app.pybossa.id;
  }
  if (filter.task_id == -1) {
    filter.task_id = page.app.task.id;
  }

  $.ajax({type: "GET", url: "/api/rundata", data: filter, contentType: 'application/json', dataType: "json", success: cb});
};
