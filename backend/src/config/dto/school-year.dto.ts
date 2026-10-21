import { Matches } from 'class-validator';

export class SchoolYearDto {
  @Matches(/^\d{4}-\d{4}$/, { message: 'School year must look like 2026-2027.' })
  name: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Start date must look like 2026-06-08.' })
  start: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'End date must look like 2027-03-31.' })
  end: string;
}