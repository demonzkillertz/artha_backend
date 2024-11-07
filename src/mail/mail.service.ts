import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import * as config from 'config';
import { InjectQueue } from '@nestjs/bull';

import { MailJobInterface } from 'src/mail/interface/mail-job.interface';
import { EmailTemplateService } from 'src/email-template/email-template.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    // @InjectQueue(config.get('mail.queueName'))
    // private mailQueue: Queue,
    private readonly emailTemplateService: EmailTemplateService,
    private mailerService: MailerService
  ) {}

  /**
   * Replace place holder
   * @param str
   * @param obj
   */
  stringInject(str = '', obj = {}) {
    let newStr = str;
    Object.keys(obj).forEach((key) => {
      const placeHolder = `{{${key}}}`;
      if (newStr.includes(placeHolder)) {
        newStr = newStr.replace(placeHolder, obj[key] || ' ');
      }
    });
    return newStr;
  }

  async sendMail(payload: MailJobInterface, type: string): Promise<Boolean> {
    const { to, subject, slug, context } = payload;
    const mailBody = await this.emailTemplateService.findBySlug(slug);
    if (!mailBody) {
      return false;
    }
    const emailContent = this.stringInject(mailBody.body, context);
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html: emailContent
      });
      return true;
    } catch (error) {
      console.error('Failed to send email', error);
      return false;
    }
  }
}
