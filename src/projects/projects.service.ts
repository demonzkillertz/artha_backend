import { Injectable, Query } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { In, Repository } from 'typeorm';
import { NotificationService } from 'src/notification/notification.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    private readonly notificationService: NotificationService,
  ) { }
  async create(createProjectDto: CreateProjectDto) {
    const { users: userIds, projectLead, ...projectData } = createProjectDto;
    // Fetch the user entities using the user IDs
    const users = await this.userRepository.findByIds(userIds);
    const lead = await this.userRepository.findOne(projectLead);
    // Create a new project and assign the fetched users
    const project = await this.projectRepository.create({
      ...projectData,
      users, // Assign the user entities here
      projectLead: lead || null
    });

    const savedProject = await this.projectRepository.save(project);

    await this.notificationService.create({ message: `Project ${savedProject.name} created`, users: userIds, link: `${process.env.frontendUrl}/projects/${savedProject.id}` });
    // Save the project with associated users
    return savedProject
  }

  async findAll(status: 'active' | 'suspended' | 'archived' | 'signed_off' | 'completed', user: UserEntity) {
    let projects = null

    if (user.role.name === 'superuser') {
      projects = await this.projectRepository.find({
        where: {
          status: status
        },
        relations: ['users', 'tasks', 'projectLead'],
        order: {
          updatedAt: 'DESC'
        }
      });
    }
    else {
      const users = await this.userRepository.findOne({
        relations: ['projects', 'projects.projectLead', 'projects.users'],
        where: {
          id: user.id
        },
      });
      projects = users.projects
    }

    return projects
  }

  findOne(id: string) {
    return this.projectRepository.findOne(id, {
      relations: ['users', 'tasks', 'projectLead']
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne(id, {
      relations: ['users']
    });

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Update project properties with the new values
    Object.assign(project, updateProjectDto);

    // If there are user updates, handle them
    if (updateProjectDto.users) {
      const users = await this.userRepository.findByIds(updateProjectDto.users);
      const lead = await this.userRepository.findOne(updateProjectDto.projectLead);
      project.projectLead = lead || null
      project.users = users; // Update users if provided

    }

    // Save the updated project back to the repository
    const updatedProject = await this.projectRepository.save(project);

    await this.notificationService.create({ message: `Project ${updatedProject.name} updated`, users: updateProjectDto.users, link: `${process.env.frontendUrl}/projects/${updatedProject.id}` });
    return updatedProject
  }

  async remove(id: string) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne(id);

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Remove the project
    await this.projectRepository.remove(project);

    // Optionally, return a success message or the removed project
    return { message: `Project with ID ${id} removed successfully` };
  }
  findByUserId(id: string) {
    return this.projectRepository.find({
      where: {
        users: {
          id: id
        }
      },
      relations: ['users']
    });
  }
}
