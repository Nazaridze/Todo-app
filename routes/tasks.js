const express = require('express');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await req.app.locals.db
      .collection('tasks')
      .find()
      .toArray();

    res.json({
      success: true,
      message: 'Tasks retrieved',
      data: tasks
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to retrieve tasks'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const task = {
      title,
      description: description || '',
      priority,
      completed: false,
      createdAt: new Date()
    };

    const result = await req.app.locals.db.collection('tasks').insertOne(task);
    task._id = result.insertedId;

    res.status(201).json({
      success: true,
      message: 'Task added',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add task'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, priority, completed } = req.body;

    const cleanData = {};

    if (title !== undefined) cleanData.title = title;
    if (description !== undefined) cleanData.description = description;
    if (priority !== undefined) cleanData.priority = priority;
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'The completed field must be a Boolean'
        });
      }

      cleanData.completed = completed;
    }

    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data to update'
      });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const result = await req.app.locals.db.collection('tasks').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: cleanData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const result = await req.app.locals.db.collection('tasks').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

module.exports = router;