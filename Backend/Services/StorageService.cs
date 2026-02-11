using Backend.Services.Interfaces;
using Supabase;
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Backend.Services;

public class StorageService : IStorageService
{
    private readonly Client _supabaseClient;
    private readonly string _supabaseUrl;

    public StorageService(Client supabaseClient, IConfiguration configuration)
    {
        _supabaseClient = supabaseClient;
        _supabaseUrl = configuration["Supabase:Url"] ?? throw new ArgumentNullException("Supabase:Url is missing in appsettings.json");
    }

    public async Task<string> UploadFileAsync(IFormFile file, string bucketName, string folderPath = "")
    {
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        // Generate a unique filename to avoid collisions
        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var fullPath = string.IsNullOrEmpty(folderPath) ? fileName : $"{folderPath}/{fileName}";

        // Upload to Supabase Storage
        await _supabaseClient.Storage
            .From(bucketName)
            .Upload(bytes, fullPath);

        // Construct Public URL
        // Format: https://<project_id>.supabase.co/storage/v1/object/public/<bucket>/<path>
        // Depending on the client version, GetPublicUrl might be available directly.
        // Let's rely on manual construction or the client helper if available.
        
        var publicUrl = _supabaseClient.Storage.From(bucketName).GetPublicUrl(fullPath);
        return publicUrl;
    }
}
