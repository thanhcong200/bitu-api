import { PartialType } from '@nestjs/mapped-types';
import { SearchDto } from 'src/common/search.dto';

export class SearchUserDto extends PartialType(SearchDto) {}
