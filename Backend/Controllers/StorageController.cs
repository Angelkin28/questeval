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
}
