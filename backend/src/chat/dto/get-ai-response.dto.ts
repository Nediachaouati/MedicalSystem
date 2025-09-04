import {IsNotEmpty,IsOptional,IsString}from 'class-validator';

export class GetAiMessageDTO{
    @IsString()
    @IsNotEmpty()
    prompt:string;

    @IsString()
    @IsOptional()
    sessionId?:string;


}