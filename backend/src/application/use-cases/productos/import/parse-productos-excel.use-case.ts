import { Injectable } from '@nestjs/common';
import { ExcelParserService } from './excel-parser.service';
import { ExcelImportResult } from './excel-parser.types';

@Injectable()
export class ParseProductosExcelUseCase {
  constructor(private readonly excelParser: ExcelParserService) {}

  async execute(buffer: Buffer): Promise<ExcelImportResult> {
    return this.excelParser.parse(buffer);
  }
}





