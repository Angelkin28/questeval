using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StorageController : ControllerBase
{
    private readonly IStorageService _storageService;

    public StorageController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    /// <summary>
    /// Uploads a file (image or video) to Supabase Storage.
    /// </summary>
    /// <param name="file">The file to upload.</param>
    /// <returns>The public URL of the uploaded file.</returns>
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile([Required] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        string bucketName = "images";
        string folderPath = "uploads";

        if (file.ContentType.StartsWith("image/"))
        {
            bucketName = "images";
        }
        else if (file.ContentType.StartsWith("video/"))
        {
            bucketName = "videos";
        }
        else
        {
            return BadRequest("Only image and video files are allowed.");
        }

        try
        {
            var publicUrl = await _storageService.UploadFileAsync(file, bucketName, folderPath);
            return Ok(new { Url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    /// <summary>
    /// Uploads a video to Supabase Storage (bucket: videos).
    /// Accepts: mp4, webm, mov, avi. Máximo 80 MB.
    /// </summary>
    /// <param name="file">The video file to upload.</param>
    /// <returns>The public URL of the uploaded video.</returns>
    [HttpPost("upload-video")]
    public async Task<IActionResult> UploadVideo([Required] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var allowedTypes = new[] { "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest("Solo se permiten archivos de video (mp4, webm, mov, avi).");

        const long maxBytes = 500L * 1024 * 1024; // 500 MB
        if (file.Length > maxBytes)
            return BadRequest("El archivo no puede superar los 500 MB.");

        try
        {
            var publicUrl = await _storageService.UploadFileAsync(file, "videos", "uploads");
            return Ok(new { Url = publicUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
