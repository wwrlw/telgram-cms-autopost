import { PublicationChannel, CreatePublicationChannelDto, UpdatePublicationChannelDto } from '../publication-channel.model';

export interface IPublicationChannelRepository {
  create(channelData: CreatePublicationChannelDto): Promise<PublicationChannel>;
  findById(id: string): Promise<PublicationChannel | null>;
  findAll(): Promise<PublicationChannel[]>;
  findActiveChannels(): Promise<PublicationChannel[]>;
  update(id: string, channelData: UpdatePublicationChannelDto): Promise<PublicationChannel | null>;
  delete(id: string): Promise<boolean>;
} 