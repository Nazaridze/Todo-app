const priorityNames = {
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

let completedTasksHidden = false;

function showMessage(text, isError = false) {
  $('#message').text(text);
  $('#message').css('color', isError ? 'red' : 'green');

  setTimeout(function () {
    $('#message').text('');
  }, 3000);
}

function loadTasks() {
  $.ajax({
    url: '/tasks',
    method: 'GET',
    success: function (response) {
      showTasks(response.data);
    },
    error: function (xhr) {
      showMessage(xhr.responseJSON?.message || 'Failed to load tasks', true);
    }
  });
}

function showTasks(tasks) {
  const activeList = $('#taskList');
  const completedList = $('#completedTaskList');
  const activeTasks = tasks.filter(function (task) {
    return task.completed !== true;
  });
  const completedTasks = tasks.filter(function (task) {
    return task.completed === true;
  });

  activeList.empty();
  completedList.empty();
  $('#activeTasksPanel').prop('hidden', activeTasks.length === 0);
  if (completedTasks.length === 0) {
    completedTasksHidden = false;
  }
  const hasCompletedTasks = completedTasks.length > 0;
  $('#taskListControls').prop('hidden', !hasCompletedTasks);
  $('#completedTasksPanel').prop('hidden', !hasCompletedTasks || completedTasksHidden);
  $('main').toggleClass('completed-tasks-hidden', completedTasksHidden && hasCompletedTasks);
  $('#toggleCompletedButton')
    .text(completedTasksHidden ? 'Show completed' : 'Hide completed')
    .attr('aria-expanded', String(!completedTasksHidden));

  tasks.forEach(function (task) {
    const card = $('<div>').addClass('task ' + task.priority);
    if (task.completed === true) {
      card.addClass('completed');
    }

    const title = $('<h3>').text(task.title);
    const description = $('<p>').text(task.description || 'No description');
    const priority = $('<p>').addClass('priority')
      .text('Priority: ' + priorityNames[task.priority]);
    const created = $('<p>').text(
      'Created: ' + new Date(task.createdAt).toLocaleDateString('en-US')
    );

    card.append(title, description, priority, created);

    const completeButton = $('<button>').text(
      task.completed === true ? 'Restore' : 'Complete'
    );
    completeButton.on('click', function () {
      updateTaskStatus(task._id, task.completed !== true);
    });

    const editButton = $('<button>').text('Edit');
    editButton.on('click', function () {
      showEditForm(card, task);
    });

    const deleteButton = $('<button>').text('Delete');
    deleteButton.css('background', '#c94343');
    deleteButton.on('click', function () {
      deleteTask(task._id);
    });

    card.append(completeButton, editButton, deleteButton);

    const taskList = task.completed === true ? completedList : activeList;
    taskList.append(card);
  });
}

$('#taskForm').on('submit', function (event) {
  event.preventDefault();

  const task = {
    title: $('#title').val(),
    description: $('#description').val(),
    priority: $('#priority').val()
  };

  $.ajax({
    url: '/tasks',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(task),
    success: function (response) {
      showMessage(response.message);
      $('#taskForm')[0].reset();
      loadTasks();
    },
    error: function (xhr) {
      const response = xhr.responseJSON;
      const errors = response?.errors ? response.errors.join(', ') : response?.message;
      showMessage(errors || 'Failed to add task', true);
    }
  });
});

function showEditForm(card, task) {
  card.empty();

  const title = $('<input>').val(task.title);
  const description = $('<textarea>').val(task.description);
  const priority = $('<select>')
    .append('<option value="high">High</option>')
    .append('<option value="medium">Medium</option>')
    .append('<option value="low">Low</option>')
    .val(task.priority);

  const saveButton = $('<button>').text('Save');
  const cancelButton = $('<button>').text('Cancel');
  cancelButton.css('background', '#777');

  saveButton.on('click', function () {
    const changes = {
      title: title.val(),
      description: description.val(),
      priority: priority.val()
    };

    $.ajax({
      url: '/tasks/' + task._id,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(changes),
      success: function (response) {
        showMessage(response.message);
        loadTasks();
      },
      error: function (xhr) {
        const response = xhr.responseJSON;
        const errors = response?.errors ? response.errors.join(', ') : response?.message;
        showMessage(errors || 'Failed to edit task', true);
      }
    });
  });

  cancelButton.on('click', loadTasks);

  card.append(
    $('<h3>').text('Edit task'),
    title,
    description,
    priority,
    saveButton,
    cancelButton
  );
}

function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  $.ajax({
    url: '/tasks/' + id,
    method: 'DELETE',
    success: function (response) {
      showMessage(response.message);
      loadTasks();
    },
    error: function (xhr) {
      showMessage(xhr.responseJSON?.message || 'Failed to delete task', true);
    }
  });
}

function updateTaskStatus(id, completed) {
  $.ajax({
    url: '/tasks/' + id,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify({ completed: completed }),
    success: function (response) {
      showMessage(response.message);
      loadTasks();
    },
    error: function (xhr) {
      showMessage(xhr.responseJSON?.message || 'Failed to update task status', true);
    }
  });
}

$(document).ready(function () {
  $('#toggleCompletedButton').on('click', function () {
    completedTasksHidden = !completedTasksHidden;
    $('#completedTasksPanel').prop('hidden', completedTasksHidden);
    $('main').toggleClass('completed-tasks-hidden', completedTasksHidden);
    $(this)
      .text(completedTasksHidden ? 'Show completed' : 'Hide completed')
      .attr('aria-expanded', String(!completedTasksHidden));
  });

  loadTasks();
});