import { EnvConfig } from "@server/shared/config/env.config";
import { ImageStorageService } from "@server/shared/services/storage/image-storage.service";
import { InstagramApiClient } from "@server/shared/services/external/instagram-api.client";
import { MapsService } from "../services/maps.service";
import { InstagramService } from "../services/instagram.service";
import { UploadsService } from "../services/uploads.service";
import { LocationQueryService } from "../services/location-query.service";

export class ServiceContainer {
  private static instance: ServiceContainer;

  readonly config: EnvConfig;
  readonly imageStorage: ImageStorageService;
  readonly instagramApi: InstagramApiClient;
  readonly mapsService: MapsService;
  readonly instagramService: InstagramService;
  readonly uploadsService: UploadsService;
  readonly locationQueryService: LocationQueryService;

  private constructor() {
    // Singletons
    this.config = EnvConfig.getInstance();
    this.imageStorage = new ImageStorageService();
    this.instagramApi = new InstagramApiClient(this.config);

    // Services with dependencies
    this.mapsService = new MapsService(this.config);
    this.instagramService = new InstagramService(
      this.instagramApi,
      this.imageStorage
    );
    this.uploadsService = new UploadsService(this.imageStorage);
    this.locationQueryService = new LocationQueryService();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}
