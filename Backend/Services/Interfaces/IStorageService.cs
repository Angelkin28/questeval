using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Backend.Services.Interfaces;

public interface IStorageService
{
    /// <summary>
    /// Uploads a file to Supabase Storage and returns the public URL.
    /// </summary>
    /// <param name="file">The file to upload.</param>
    /// <param name="bucketName">The name of the Supabase bucket (e.g. "images").</param>
    /// <param name="folderPath">Optional folder path inside the bucket.</param>
    /// <returns>Public URL of the uploaded file.</returns>
    Task<string> UploadFileAsync(IFormFile file, string bucketName, string folderPath = "");
}
