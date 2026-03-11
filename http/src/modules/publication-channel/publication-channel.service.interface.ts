import { PublicationChannel, CreatePublicationChannelDto, UpdatePublicationChannelDto, PublicationChannelResponse } from './publication-channel.model';

export interface IPublicationChannelService {
  createPublicationChannel(channelData: CreatePublicationChannelDto): Promise<PublicationChannelResponse>;
  getPublicationChannelById(id: string): Promise<PublicationChannelResponse>;
  getAllPublicationChannels(): Promise<PublicationChannelResponse[]>;
  getActivePublicationChannels(): Promise<PublicationChannelResponse[]>;
  updatePublicationChannel(id: string, channelData: UpdatePublicationChannelDto): Promise<PublicationChannelResponse>;
  deletePublicationChannel(id: string): Promise<boolean>;
} 