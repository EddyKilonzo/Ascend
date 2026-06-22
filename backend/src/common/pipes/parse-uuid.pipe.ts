import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!uuidValidate(value)) {
      throw new BadRequestException(`'${value}' is not a valid UUID`);
    }
    return value;
  }
}
