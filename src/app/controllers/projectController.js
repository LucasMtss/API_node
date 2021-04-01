const express = require('express');
const authMiddleware = require("../middlewares/auth");
const router = express.Router();
const Project = require('../models/project');
const Task = require('../models/task');

router.use(authMiddleware);

// List
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate(['user', 'tasks']); // Populate parecido com inner join, pega os dados relacionados a outro documento
    return res.send({ projects });
  } catch (err) {
    res.status(400).send({ error: 'Error loading projects'});  
  }
});

// Show
router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(['user', 'tasks']); // Populate parecido com inner join, pega os dados relacionados a outro documento
    return res.send({ project });
  } catch (err) {
    res.status(400).send({ error: 'Error loading project'});
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const { title, description, tasks} = req.body;
    const project = await Project.create({ title, description, user: req.userId }); // Deixando de passar as tasks na criação para evitar erros

    // await Promise.all() faz aguardar todos os awaits dentro de map para depois executar o comando project.save()
    await Promise.all( tasks.map(async task =>{
      // O new equivale ao create, porém ele cria mas não salva
      const projectTask = new Task({ ...task, project: project._id}); // Passando todos os atributos da task e referenciando o id do projeto

      await projectTask.save();
      project.tasks.push(projectTask);
    }));

    await project.save();

    return res.send({ project });
  } catch (err) {
    return res.status(400).send({ error: 'Error creating new project'});
    
  }
});

// Update
router.put('/:projectId', async (req, res) => {
  try {
    const { title, description, tasks} = req.body;
    const project = await Project.findByIdAndUpdate(req.params.projectId, { 
      title, 
      description,
    }, { new: true }); // new true serve para retornar o objeto atualizado com os novos valores

    // Deletando todas as tasks antes de criá-las novamente
    project.tasks = [];
    await Task.remove({ project: project._id });

    // await Promise.all() faz aguardar todos os awaits dentro de map para depois executar o comando project.save()
    await Promise.all( tasks.map(async task =>{
      // O new equivale ao create, porém ele cria mas não salva
      const projectTask = new Task({ ...task, project: project._id}); // Passando todos os atributos da task e referenciando o id do projeto

      await projectTask.save();
      project.tasks.push(projectTask);
    }));

    await project.save();

    return res.send({ project });
  } catch (err) {
    return res.status(400).send({ error: 'Error updating project'});
    
  }
});

// Delete
router.delete('/:projectId', async (req, res) => {
  try {
    await Project.findByIdAndRemove(req.params.projectId); // Populate parecido com inner join, pega os dados relacionados a outro documento
    return res.send();
  } catch (err) {
    res.status(400).send({ error: 'Error deleting project'});
  }
});

module.exports = app => app.use('/projects', router);